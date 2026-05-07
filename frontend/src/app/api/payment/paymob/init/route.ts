import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { z } from "zod"
import { storeConfig } from "@/config/store.config"
import { createPaymobPayment } from "@/lib/paymob"
import type { Order } from "@/types"

const schema = z.object({
  order_id: z.string().uuid("Invalid order id"),
})

/**
 * POST /api/payment/paymob/init
 * Body: { order_id }
 *
 * Confirms the order exists, then runs Paymob's auth → register → payment-key
 * chain and returns the iframe URL the storefront should redirect to.
 *
 * Errors are returned with a meaningful message; the storefront surfaces them
 * directly so misconfigured envs are obvious during setup.
 */
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

  const { order_id } = parsed.data

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", order_id)
    .maybeSingle()
  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const order = data as Order

  // Refuse if it's already paid (don't double-charge)
  if (order.payment_status === "paid") {
    return NextResponse.json(
      { error: "This order has already been paid." },
      { status: 409 }
    )
  }

  // Build Paymob items: amount_cents must be in EGP cents (piasters)
  const items = order.items.map((it) => ({
    name: it.name.slice(0, 255),
    amount_cents: Math.round(it.price * 100),
    description: "",
    quantity: it.quantity,
  }))
  const totalCents = Math.round(order.total * 100)

  const fullName = order.customer_info.name.trim().split(/\s+/)
  const firstName = fullName[0] || "Customer"
  const lastName = fullName.slice(1).join(" ") || "—"

  try {
    const { paymobOrderId, iframeUrl } = await createPaymobPayment({
      internalOrderId: order.id,
      amountCents: totalCents,
      currency: storeConfig.delivery.currency,
      items,
      billing: {
        first_name: firstName,
        last_name: lastName,
        email: order.customer_info.email || "no-reply@example.com",
        phone_number: order.customer_info.phone || "+201000000000",
        street: order.delivery_address.address || "NA",
        city: order.delivery_address.city || "Cairo",
        country: "EG",
      },
    })

    // Persist the paymob_order_id on our row so the webhook can cross-reference
    await supabase
      .from("orders")
      .update({
        paymob_order_id: String(paymobOrderId),
        payment_status: "awaiting_payment",
      })
      .eq("id", order.id)

    return NextResponse.json({ iframeUrl })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unable to initialise payment"
    console.error("[paymob/init]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
