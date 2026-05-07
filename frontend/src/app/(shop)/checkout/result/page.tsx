import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { storeConfig } from "@/config/store.config"
import { formatOrderNumber } from "@/lib/orderNumber"
import type { Order } from "@/types"

export const dynamic = "force-dynamic"

export const metadata = { title: "Payment Result" }

interface Props {
  /**
   * Paymob redirects with `success`, `merchant_order_id`, `id` (transaction id),
   * etc. as query params. We trust nothing here — we only render based on the
   * payment_status that the webhook updated server-side. The query params are
   * used purely to know which order to look up.
   */
  searchParams: { merchant_order_id?: string; success?: string; order?: string }
}

export default async function PaymentResultPage({ searchParams }: Props) {
  const orderId = searchParams.merchant_order_id ?? searchParams.order ?? null
  let order: Order | null = null
  if (orderId) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle()
    order = (data as Order) ?? null
  }

  // Webhook may not have arrived yet — fall back to query-param hint
  const queryHintSuccess = searchParams.success === "true"
  const isPaid = order?.payment_status === "paid" || (queryHintSuccess && order?.payment_status === "awaiting_payment")
  const isFailed = order?.payment_status === "failed"

  const shortId = order?.order_number ? formatOrderNumber(order.order_number) : null

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-10 py-16 md:py-24">
      <div
        className="rounded-card card-shadow p-8 md:p-12 text-center space-y-6"
        style={{ backgroundColor: "#ffffff" }}
      >
        {isPaid ? (
          <>
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{
                backgroundColor: "rgba(74,93,77,0.12)",
                color: "var(--color-accent)",
              }}
              aria-hidden="true"
            >
              ✓
            </div>
            <div className="space-y-2">
              <h1
                className="text-[28px] md:text-[36px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--color-primary)",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                }}
              >
                Payment Confirmed
              </h1>
              <p
                className="text-base"
                style={{ color: "rgba(42,61,46,0.65)", lineHeight: 1.8 }}
              >
                Thank you for shopping with{" "}
                <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                  {storeConfig.brand.name}
                </span>
                . We&rsquo;ll prepare your order shortly.
              </p>
            </div>
          </>
        ) : isFailed ? (
          <>
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{
                backgroundColor: "rgba(220,38,38,0.12)",
                color: "#dc2626",
              }}
              aria-hidden="true"
            >
              ×
            </div>
            <div className="space-y-2">
              <h1
                className="text-[28px] md:text-[36px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--color-primary)",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                }}
              >
                Payment Failed
              </h1>
              <p
                className="text-base"
                style={{ color: "rgba(42,61,46,0.65)", lineHeight: 1.8 }}
              >
                We couldn&rsquo;t process your card. You can try again below or
                switch to cash on delivery.
              </p>
            </div>
          </>
        ) : (
          <>
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{
                backgroundColor: "rgba(180,83,9,0.12)",
                color: "#b45309",
              }}
              aria-hidden="true"
            >
              …
            </div>
            <div className="space-y-2">
              <h1
                className="text-[28px] md:text-[36px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--color-primary)",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                }}
              >
                Confirming Payment
              </h1>
              <p
                className="text-base"
                style={{ color: "rgba(42,61,46,0.65)", lineHeight: 1.8 }}
              >
                Your payment is being verified. This page will update once
                Paymob confirms — refreshing in a few seconds usually works.
              </p>
            </div>
          </>
        )}

        {shortId && (
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-mono"
            style={{
              backgroundColor: "rgba(74,93,77,0.18)",
              color: "var(--color-accent)",
              fontWeight: 500,
            }}
          >
            <span
              className="text-xs font-sans"
              style={{ color: "rgba(42,61,46,0.5)", fontWeight: 400 }}
            >
              Order
            </span>
            {shortId}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isFailed && order?.id && (
            <Link
              href={`/checkout/payment?orderId=${order.id}`}
              className="inline-flex text-[11px] uppercase font-medium text-white rounded-[2px] items-center justify-center hover:opacity-85"
              style={{
                backgroundColor: "var(--color-accent)",
                height: "52px",
                padding: "0 36px",
                letterSpacing: "0.22em",
              }}
            >
              Try Card Again
            </Link>
          )}
          <Link
            href="/shop"
            className="inline-flex text-[11px] uppercase font-medium text-white rounded-[2px] items-center justify-center hover:opacity-85"
            style={{
              backgroundColor: "var(--color-primary)",
              height: "52px",
              padding: "0 36px",
              letterSpacing: "0.25em",
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
