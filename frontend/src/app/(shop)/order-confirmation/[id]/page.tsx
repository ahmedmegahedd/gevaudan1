import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { storeConfig } from "@/config/store.config"
import { formatOrderNumber } from "@/lib/orderNumber"
import type { Order } from "@/types"

interface Props {
  params: { id: string }
}

export const dynamic = "force-dynamic"

export function generateMetadata() {
  return { title: `Order Confirmed | ${storeConfig.brand.name}` }
}

export default async function OrderConfirmationPage({ params }: Props) {
  const supabase = await createClient()

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!order) notFound()

  const o = order as Order
  const { currency } = storeConfig.delivery
  const { brand, theme } = storeConfig

  const shortId = formatOrderNumber(o.order_number)
  const waNumber = brand.whatsapp.replace(/[^0-9]/g, "")
  const waMessage = encodeURIComponent(
    `Hi! I just placed order ${shortId} on ${brand.name}`
  )
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`

  return (
    <div className="min-h-screen flex items-start justify-center py-16 md:py-24 px-4">
      <div
        className="w-full max-w-md overflow-hidden rounded-card card-shadow"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Accent top bar */}
        <div className="h-1" style={{ backgroundColor: theme.accentColor }} />

        <div className="px-6 pt-10 pb-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-5">
            {/* Static checkmark circle */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${theme.accentColor}18` }}
            >
              <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="25" stroke={theme.accentColor} strokeWidth="2" fill="none" />
                <path
                  d="M14 27l8 8 16-18"
                  stroke={theme.accentColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h1
                className="text-[28px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--color-primary)",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                }}
              >
                Order Placed Successfully!
              </h1>
              <p className="text-sm" style={{ color: "rgba(42,61,46,0.5)", lineHeight: 1.7 }}>
                Thank you for shopping with{" "}
                <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                  {brand.name}
                </span>
              </p>
            </div>

            {/* Order ID */}
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-mono"
              style={{ backgroundColor: `${theme.accentColor}18`, color: theme.accentColor, fontWeight: 500 }}
            >
              <span className="text-xs font-sans" style={{ color: "rgba(42,61,46,0.5)", fontWeight: 400 }}>
                Order
              </span>
              #{shortId}
            </div>

            <p className="text-sm" style={{ color: "rgba(42,61,46,0.55)", lineHeight: 1.8 }}>
              We will contact you on{" "}
              <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                {o.customer_info.phone}
              </span>{" "}
              to confirm your order and arrange delivery.
            </p>
          </div>

          {/* Delivery info */}
          <div
            className="rounded-card px-5 py-4 text-sm space-y-2"
            style={{ backgroundColor: "rgba(168,200,224,0.4)" }}
          >
            <p
              className="text-[10px] uppercase font-medium mb-2"
              style={{ color: "rgba(42,61,46,0.5)", letterSpacing: "0.18em" }}
            >
              Delivery To
            </p>
            <p style={{ color: "var(--color-primary)", lineHeight: 1.7 }}>
              {o.delivery_address.city} — {o.delivery_address.address}
            </p>
            {o.delivery_address.notes && (
              <p className="text-xs" style={{ color: "rgba(42,61,46,0.4)" }}>
                {o.delivery_address.notes}
              </p>
            )}
          </div>

          {/* Order items */}
          <div className="rounded-card overflow-hidden" style={{ border: "1px solid var(--divider-soft)" }}>
            <div
              className="px-5 py-3 text-[10px] uppercase font-medium"
              style={{
                backgroundColor: "rgba(42,61,46,0.04)",
                color: "var(--color-primary)",
                letterSpacing: "0.18em",
              }}
            >
              Your Items
            </div>
            <ul>
              {o.items.map((item, i) => {
                const variantLabel = item.variant
                  ? Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(", ")
                  : null
                return (
                  <li
                    key={i}
                    className="flex justify-between items-start px-5 py-4 text-sm gap-3"
                    style={i > 0 ? { borderTop: "1px solid var(--divider-soft)" } : undefined}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{
                          color: "var(--color-primary)",
                          fontFamily: "var(--font-heading)",
                          fontWeight: 500,
                        }}
                      >
                        {item.name}
                      </p>
                      {variantLabel && (
                        <p className="text-xs mt-1" style={{ color: "rgba(42,61,46,0.4)" }}>{variantLabel}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="price-text" style={{ color: theme.accentColor }}>
                        {currency} {(item.price * item.quantity).toLocaleString()}
                      </span>
                      {item.quantity > 1 && (
                        <p className="text-xs" style={{ color: "rgba(42,61,46,0.4)" }}>×{item.quantity}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div
              className="px-5 py-4 space-y-2 text-sm"
              style={{ borderTop: "1px solid var(--divider-soft)" }}
            >
              <div className="flex justify-between" style={{ color: "rgba(42,61,46,0.5)" }}>
                <span>Subtotal</span>
                <span>{currency} {o.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between" style={{ color: "rgba(42,61,46,0.5)" }}>
                <span>Delivery</span>
                <span style={{ color: o.delivery_fee === 0 ? "#16a34a" : undefined }}>
                  {o.delivery_fee === 0 ? "Free" : `${currency} ${o.delivery_fee.toLocaleString()}`}
                </span>
              </div>
              <div
                className="flex justify-between text-base pt-3"
                style={{
                  borderTop: "1px solid var(--divider-soft)",
                  color: "var(--color-primary)",
                  fontWeight: 500,
                }}
              >
                <span>Total</span>
                <span className="price-text">{currency} {o.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-3 text-[11px] uppercase font-medium text-white hover:opacity-90 rounded-[2px]"
            style={{
              backgroundColor: "#25D366",
              height: "52px",
              letterSpacing: "0.18em",
            }}
          >
            <WhatsAppIcon />
            Chat with us on WhatsApp
          </a>

          {/* Continue shopping */}
          <Link
            href="/shop"
            className="flex w-full items-center justify-center text-[11px] uppercase font-medium text-white hover:opacity-85 rounded-[2px]"
            style={{
              backgroundColor: "var(--color-primary)",
              height: "52px",
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

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
