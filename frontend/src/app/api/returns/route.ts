import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { z } from "zod"

const itemSchema = z.object({
  product_id: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().min(1),
  variant: z.record(z.string(), z.string()).optional(),
})

const schema = z
  .object({
    order_id: z.string().uuid("Invalid order ID"),
    customer_name: z.string().trim().min(2, "Name is required"),
    customer_phone: z.string().trim().min(7, "Phone is required"),
    request_type: z.enum(["refund", "exchange"]),
    reason: z.string().trim().min(20, "Reason must be at least 20 characters"),
    items: z.array(itemSchema).min(1, "Select at least one item to return"),
    exchange_product_id: z.string().uuid().nullable().optional(),
  })
  .refine(
    (v) => v.request_type !== "exchange" || !!v.exchange_product_id,
    { path: ["exchange_product_id"], message: "Pick a replacement product for an exchange" }
  )

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

  const v = parsed.data

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // Confirm the order exists (defence against forged ids)
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", v.order_id)
    .maybeSingle()
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("return_requests")
    .insert({
      order_id: v.order_id,
      customer_name: v.customer_name,
      customer_phone: v.customer_phone,
      request_type: v.request_type,
      reason: v.reason,
      items: v.items,
      exchange_product_id: v.request_type === "exchange" ? (v.exchange_product_id ?? null) : null,
      status: "pending",
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
