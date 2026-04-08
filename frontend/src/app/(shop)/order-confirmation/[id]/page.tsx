import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { storeConfig } from "@/config/store.config"
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

  const shortId = o.id.slice(0, 8).toUpperCase()
  const waNumber = brand.whatsapp.replace(/[^0-9]/g, "")
  const waMessage = encodeURIComponent(
    `Hi! I just placed order #${shortId} on ${brand.name}`
  )
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`

  return (
    <div className="min-h-screen bg-[#f8f5f0] flex items-start justify-center py-12 px-4">
      <div className="bg-[#f8f5f0] w-full max-w-md rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: "#e5e7eb" }}>
        {/* Accent top bar */}
        <div className="h-1.5" style={{ backgroundColor: theme.accentColor }} />

        <div className="px-6 pt-8 pb-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Static checkmark circle */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${theme.accentColor}18` }}
            >
              <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
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

            <div>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
              >
                Order Placed Successfully!
              </h1>
              <p className="text-sm text-gray-500">
                Thank you for shopping with{" "}
                <span className="font-semibold" style={{ color: "var(--color-primary)" }}>
                  {brand.name}
                </span>
              </p>
            </div>

            {/* Order ID */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono font-semibold"
              style={{ backgroundColor: `${theme.accentColor}18`, color: theme.accentColor }}
            >
              <span className="text-xs font-sans font-normal text-gray-500">Order</span>
              #{shortId}
            </div>

            <p className="text-sm text-gray-500 leading-relaxed">
              We will contact you on{" "}
              <span className="font-semibold" style={{ color: "var(--color-primary)" }}>
                {o.customer_info.phone}
              </span>{" "}
              to confirm your order and arrange delivery.
            </p>
          </div>

          {/* Delivery info */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Delivery To</p>
            <p style={{ color: "var(--color-primary)" }}>
              {o.delivery_address.city} — {o.delivery_address.address}
            </p>
            {o.delivery_address.notes && (
              <p className="text-gray-400 text-xs">{o.delivery_address.notes}</p>
            )}
          </div>

          {/* Order items */}
          <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            <div
              className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
              style={{ backgroundColor: "#f9fafb", color: "var(--color-primary)" }}
            >
              Your Items
            </div>
            <ul className="divide-y divide-gray-100">
              {o.items.map((item, i) => {
                const variantLabel = item.variant
                  ? Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(", ")
                  : null
                return (
                  <li key={i} className="flex justify-between items-start px-4 py-3 text-sm gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: "var(--color-primary)" }}>
                        {item.name}
                      </p>
                      {variantLabel && (
                        <p className="text-xs text-gray-400 mt-0.5">{variantLabel}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span style={{ color: theme.accentColor }} className="font-medium">
                        {currency} {(item.price * item.quantity).toLocaleString()}
                      </span>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-400">×{item.quantity}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="px-4 py-3 space-y-1.5 border-t text-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{currency} {o.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span>
                <span style={{ color: o.delivery_fee === 0 ? "#16a34a" : undefined }}>
                  {o.delivery_fee === 0 ? "Free" : `${currency} ${o.delivery_fee.toLocaleString()}`}
                </span>
              </div>
              <div
                className="flex justify-between font-bold text-base pt-2 border-t"
                style={{ borderColor: "#e5e7eb", color: "var(--color-primary)" }}
              >
                <span>Total</span>
                <span>{currency} {o.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#25D366" }}
          >
            <WhatsAppIcon />
            Chat with us on WhatsApp
          </a>

          {/* Continue shopping */}
          <Link
            href="/shop"
            className="flex w-full items-center justify-center py-3.5 rounded-xl text-sm font-semibold uppercase tracking-widest text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: "var(--color-primary)" }}
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
