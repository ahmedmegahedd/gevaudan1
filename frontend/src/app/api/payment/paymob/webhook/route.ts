import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { verifyPaymobHmac } from "@/lib/paymob"
import { sendOrderConfirmationEmail } from "@/lib/emails/sendOrderConfirmation"
import type { Order } from "@/types"

/**
 * POST /api/payment/paymob/webhook?hmac=…
 *
 * Paymob's "Transaction Processed Callback" — fires after every payment
 * attempt with a JSON payload describing the transaction. We verify the
 * HMAC-SHA512 signature against our merchant secret, then mark the matching
 * order as paid or failed.
 *
 * Configure the URL in Paymob Dashboard → Developers → Notification URLs:
 *   https://YOUR-DOMAIN/api/payment/paymob/webhook?hmac={hmac}
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const hmac = url.searchParams.get("hmac") ?? ""

  let payload: { obj?: Record<string, unknown> }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Verify signature before doing anything else
  if (!verifyPaymobHmac(payload, hmac)) {
    console.warn("[paymob/webhook] HMAC mismatch — refusing payload")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = (payload.obj ?? {}) as any
  const success: boolean = obj.success === true
  const transactionId: number | undefined = obj.id
  const order = obj.order ?? {}
  const merchantOrderId: string | undefined = order.merchant_order_id
  const paymobOrderId: number | undefined = order.id

  if (!merchantOrderId) {
    return NextResponse.json(
      { error: "merchant_order_id missing — can't link to a local order" },
      { status: 400 }
    )
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const updates: Record<string, unknown> = {
    payment_status: success ? "paid" : "failed",
    paymob_transaction_id: transactionId ? String(transactionId) : null,
  }
  if (paymobOrderId && !obj.is_voided && !obj.is_refunded) {
    updates.paymob_order_id = String(paymobOrderId)
  }

  const { data: updatedRow, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", merchantOrderId)
    .select("*")
    .single()

  if (error) {
    console.error("[paymob/webhook] update failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send the order confirmation email on a successful card payment.
  // (COD orders email at insert-time; card orders defer until paid.)
  if (success && updatedRow) {
    try {
      const result = await sendOrderConfirmationEmail(updatedRow as Order)
      if (result.error) {
        console.error("[paymob/webhook] confirmation email failed:", result.error)
      }
    } catch (e) {
      console.error("[paymob/webhook] confirmation email threw:", e)
    }
  }

  return NextResponse.json({ ok: true })
}

/**
 * Paymob also sometimes pings the callback URL with GET while testing.
 * Acknowledge so they don't mark the URL as broken.
 */
export async function GET() {
  return NextResponse.json({ ok: true })
}
