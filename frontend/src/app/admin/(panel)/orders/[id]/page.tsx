import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { storeConfig } from "@/config/store.config"
import OrderStatusForm from "@/components/admin/OrderStatusForm"
import { formatOrderNumber } from "@/lib/orderNumber"
import type { Order, OrderStatus } from "@/types"

export const dynamic = "force-dynamic"

interface Props {
  params: { id: string }
}

export function generateMetadata() {
  return { title: "Order Details" }
}

const statusColors: Record<OrderStatus, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  delivered: "#10b981",
  cancelled: "#ef4444",
}

export default async function OrderDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { currency, brand } = { currency: storeConfig.delivery.currency, brand: storeConfig.brand }

  const { data: raw } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!raw) notFound()

  const order = raw as Order
  const shortId = formatOrderNumber(order.order_number)

  // Fetch product images for each order item
  const productIds = order.items.map((i) => i.product_id).filter(Boolean)
  const imageMap: Record<string, string> = {}
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, images")
      .in("id", productIds)
    for (const p of products ?? []) {
      if (p.images?.[0]) imageMap[p.id] = p.images[0]
    }
  }

  // WhatsApp message
  const waPhone = order.customer_info.phone.replace(/[^0-9]/g, "")
  const waMessage = encodeURIComponent(
    `Hi ${order.customer_info.name}, your order ${shortId} from ${brand.name} is ${order.status}. Thank you!`
  )
  const waLink = `https://wa.me/${waPhone}?text=${waMessage}`

  const orderDate = new Date(order.created_at)

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* ── Back + Header ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Orders
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            Order {shortId}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {orderDate.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}{" "}
            at{" "}
            {orderDate.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span
          className="text-sm font-semibold px-3 py-1.5 rounded-full capitalize"
          style={{
            backgroundColor: `${statusColors[order.status]}18`,
            color: statusColors[order.status],
          }}
        >
          {order.status}
        </span>
      </div>

      {/* ── Customer Information ── */}
      <Section title="Customer Information">
        <Row label="Name" value={order.customer_info.name} />
        <Row
          label="Phone"
          value={
            <a
              href={`tel:${order.customer_info.phone}`}
              className="font-semibold hover:underline"
              style={{ color: "var(--color-accent)" }}
            >
              {order.customer_info.phone}
            </a>
          }
        />
        <Row label="City" value={order.delivery_address.city} />
        <Row label="Address" value={order.delivery_address.address} />
        {order.delivery_address.notes && (
          <Row label="Notes" value={order.delivery_address.notes} muted />
        )}
      </Section>

      {/* ── Order Items ── */}
      <div className="bg-white border rounded-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        <div
          className="px-4 py-3 border-b text-xs font-semibold uppercase tracking-wider text-gray-400"
          style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
        >
          Order Items ({order.items.length})
        </div>
        <ul className="divide-y divide-gray-100">
          {order.items.map((item, i) => {
            const image = imageMap[item.product_id]
            const variantLabel = item.variant
              ? Object.entries(item.variant)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" · ")
              : null

            return (
              <li key={i} className="flex gap-3 px-4 py-3">
                {/* Thumbnail */}
                <div className="relative w-14 h-20 shrink-0 bg-gray-100 overflow-hidden rounded-sm">
                  {image ? (
                    <Image
                      src={image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[9px] text-center leading-tight px-1">
                      No image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 py-0.5">
                  <p className="font-medium text-sm leading-snug" style={{ color: "var(--color-primary)" }}>
                    {item.name}
                  </p>
                  {variantLabel && (
                    <p className="text-xs text-gray-400 mt-0.5">{variantLabel}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {currency} {item.price.toLocaleString()} × {item.quantity}
                  </p>
                </div>

                {/* Item subtotal */}
                <div className="text-right shrink-0 py-0.5">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                    {currency} {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Totals */}
        <div className="px-4 py-4 border-t space-y-2 text-sm" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{currency} {order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Delivery</span>
            <span style={{ color: order.delivery_fee === 0 ? "#16a34a" : undefined }}>
              {order.delivery_fee === 0 ? "Free" : `${currency} ${order.delivery_fee.toLocaleString()}`}
            </span>
          </div>
          <div
            className="flex justify-between font-bold text-base pt-2 border-t"
            style={{ borderColor: "#e5e7eb", color: "var(--color-primary)" }}
          >
            <span>Total</span>
            <span>{currency} {order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── Order Actions ── */}
      <Section title="Order Actions">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Update Status</p>
            <OrderStatusForm orderId={order.id} currentStatus={order.status} />
          </div>

          <div className="pt-2 border-t" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Contact Customer</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white rounded-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#25D366" }}
              >
                <WhatsAppIcon />
                WhatsApp {order.customer_info.name.split(" ")[0]}
              </a>
              <a
                href={`tel:${order.customer_info.phone}`}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-sm border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#e5e7eb", color: "var(--color-primary)" }}
              >
                <PhoneIcon />
                Call {order.customer_info.phone}
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Order Meta ── */}
      <Section title="Order Info">
        <Row label="Order #" value={<span className="font-mono">{shortId}</span>} />
        <Row
          label="Internal ID"
          value={<span className="font-mono text-[10px] text-gray-400">{order.id}</span>}
        />
        <Row
          label="Placed"
          value={orderDate.toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
        <Row label="Items" value={`${order.items.length} item${order.items.length !== 1 ? "s" : ""}`} />
      </Section>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      <div
        className="px-4 py-3 border-b text-xs font-semibold uppercase tracking-wider text-gray-400"
        style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
      >
        {title}
      </div>
      <div className="px-4 py-4 space-y-3">{children}</div>
    </div>
  )
}

function Row({
  label,
  value,
  muted,
}: {
  label: string
  value: React.ReactNode
  muted?: boolean
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span
        className={`text-right ${muted ? "text-gray-400 italic" : "font-medium"}`}
        style={{ color: muted ? undefined : "var(--color-primary)" }}
      >
        {value}
      </span>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  )
}
