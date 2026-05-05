import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { z } from "zod"
import { parseOrderNumber } from "@/lib/orderNumber"
import type { Order } from "@/types"

const RETURN_WINDOW_DAYS = 14
const RETURN_WINDOW_MS = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000

const schema = z.object({
  order_id: z.string().trim().min(1, "Order ID is required"),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 })
  }

  const orderIdRaw = parsed.data.order_id.trim()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // Accept any of:
  //   1. "G00012" / "g12" / "12"   →  look up by sequential order_number
  //   2. Full UUID                 →  look up by id
  let order: Order | null = null

  const numeric = parseOrderNumber(orderIdRaw)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdRaw)

  if (numeric !== null) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", numeric)
      .maybeSingle()
    order = (data as Order) ?? null
  } else if (isUuid) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderIdRaw)
      .maybeSingle()
    order = (data as Order) ?? null
  }

  if (!order) {
    return NextResponse.json({ error: "No order found with this ID" }, { status: 404 })
  }

  // 14-day return window
  const placedAt = new Date(order.created_at).getTime()
  const ageMs = Date.now() - placedAt
  if (ageMs > RETURN_WINDOW_MS) {
    return NextResponse.json(
      {
        error:
          "This order is outside the 14-day return window. Returns and exchanges are only accepted within 14 days of order placement.",
      },
      { status: 410 }
    )
  }

  // Fetch product images for each item line so the storefront can show thumbnails
  const productIds = Array.from(
    new Set(order.items.map((i) => i.product_id).filter(Boolean))
  )
  const productImages: Record<string, string | null> = {}
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, images")
      .in("id", productIds)
    for (const p of (products as { id: string; images: string[] | null }[] | null) ?? []) {
      productImages[p.id] = p.images?.[0] ?? null
    }
  }

  return NextResponse.json({
    order,
    productImages,
    returnWindowDays: RETURN_WINDOW_DAYS,
  })
}
