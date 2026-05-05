import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { storeConfig } from "@/config/store.config"
import ReturnRequestDetail from "./ReturnRequestDetail"
import type { Order, ReturnRequest } from "@/types"

export const dynamic = "force-dynamic"

interface Props {
  params: { id: string }
}

export const metadata = { title: "Return Request" }

export default async function ReturnRequestPage({ params }: Props) {
  const supabase = await createClient()

  const { data: requestRow } = await supabase
    .from("return_requests")
    .select("*")
    .eq("id", params.id)
    .maybeSingle()

  if (!requestRow) notFound()

  const req = requestRow as ReturnRequest

  // Fetch the linked order
  const { data: orderRow } = await supabase
    .from("orders")
    .select("*")
    .eq("id", req.order_id)
    .maybeSingle()
  const order = (orderRow as Order | null) ?? null

  // Fetch product images for items in the request
  const productIds = Array.from(
    new Set(req.items.map((i) => i.product_id).filter(Boolean))
  )
  const productImages: Record<string, string | null> = {}
  if (productIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select("id, images")
      .in("id", productIds)
    for (const p of (data as { id: string; images: string[] | null }[] | null) ?? []) {
      productImages[p.id] = p.images?.[0] ?? null
    }
  }

  // If exchange, fetch the requested replacement product
  let exchangeProduct: ReturnRequest["exchange_product"] = null
  if (req.exchange_product_id) {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, images")
      .eq("id", req.exchange_product_id)
      .maybeSingle()
    if (data) {
      exchangeProduct = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        price: data.price,
        images: data.images ?? [],
      }
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/admin/returns"
        className="text-xs uppercase tracking-wider hover:opacity-70"
        style={{ color: "var(--color-accent)", letterSpacing: "0.18em" }}
      >
        ← All Requests
      </Link>

      <PageHeader request={req} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Card title="Items in Request">
            <ul className="space-y-4">
              {req.items.map((it, i) => {
                const img = productImages[it.product_id]
                const variantLabel = it.variant
                  ? Object.entries(it.variant)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")
                  : null
                return (
                  <li key={i} className="flex items-start gap-4">
                    <div
                      className="relative w-16 aspect-[3/4] shrink-0 overflow-hidden rounded-sm"
                      style={{ backgroundColor: "#E0D5C2" }}
                    >
                      {img ? (
                        <Image src={img} alt={it.name} fill className="object-cover" sizes="64px" />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm"
                        style={{
                          color: "var(--color-primary)",
                          fontFamily: "var(--font-heading)",
                          fontWeight: 500,
                        }}
                      >
                        {it.name}
                      </p>
                      {variantLabel && (
                        <p className="text-xs text-gray-500 mt-0.5">{variantLabel}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">
                        Qty {it.quantity} · {storeConfig.delivery.currency}{" "}
                        {(it.price * it.quantity).toLocaleString()}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          {exchangeProduct && (
            <Card title="Requested Exchange">
              <div className="flex items-start gap-4">
                <div
                  className="relative w-20 aspect-[3/4] shrink-0 overflow-hidden rounded-sm"
                  style={{ backgroundColor: "#E0D5C2" }}
                >
                  {exchangeProduct.images?.[0] ? (
                    <Image
                      src={exchangeProduct.images[0]}
                      alt={exchangeProduct.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <Link
                    href={`/shop/${exchangeProduct.slug}`}
                    target="_blank"
                    className="text-base hover:underline"
                    style={{
                      color: "var(--color-primary)",
                      fontFamily: "var(--font-heading)",
                      fontWeight: 500,
                    }}
                  >
                    {exchangeProduct.name}
                  </Link>
                  <p className="text-sm mt-1" style={{ color: "var(--color-accent)" }}>
                    {storeConfig.delivery.currency}{" "}
                    {exchangeProduct.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card title="Customer Reason">
            <p
              className="text-sm whitespace-pre-line"
              style={{ color: "rgba(61,20,25,0.75)", lineHeight: 1.8 }}
            >
              {req.reason}
            </p>
          </Card>

          {order && <OrderSummaryCard order={order} />}
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <p className="text-sm" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
              {req.customer_name}
            </p>
            <p className="text-sm text-gray-500 mt-1">{req.customer_phone}</p>
            {order?.customer_info?.email && (
              <p className="text-sm text-gray-500 mt-1">{order.customer_info.email}</p>
            )}
          </Card>

          <ReturnRequestDetail
            id={req.id}
            initialStatus={req.status}
            initialNotes={req.admin_notes ?? ""}
          />
        </div>
      </div>
    </div>
  )
}

function PageHeader({ request }: { request: ReturnRequest }) {
  const shortId = request.id.slice(0, 8).toUpperCase()
  const orderShort = request.order_id.slice(0, 8).toUpperCase()
  const date = new Date(request.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          Return Request
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          <span className="font-mono">#{shortId}</span> · Order{" "}
          <Link
            href={`/admin/orders/${request.order_id}`}
            className="font-mono hover:underline"
            style={{ color: "var(--color-accent)" }}
          >
            #{orderShort}
          </Link>{" "}
          · {date}
        </p>
      </div>
      <span
        className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
        style={{
          backgroundColor: request.request_type === "refund" ? "#e0f2fe" : "#ede9fe",
          color: request.request_type === "refund" ? "#0369a1" : "#6d28d9",
        }}
      >
        {request.request_type}
      </span>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-sm p-5" style={{ borderColor: "#e5e7eb" }}>
      <h2
        className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-4 pb-3 border-b"
        style={{ borderColor: "#f3f4f6" }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

function OrderSummaryCard({ order }: { order: Order }) {
  const { currency } = storeConfig.delivery
  return (
    <Card title="Original Order">
      <div className="space-y-2 text-sm">
        <Row label="Total">
          <span className="font-mono">
            {currency} {order.total.toLocaleString()}
          </span>
        </Row>
        <Row label="Placed">
          {new Date(order.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Row>
        <Row label="Address">
          {order.delivery_address.city}, {order.delivery_address.address}
        </Row>
        <Row label="Status">
          <span style={{ textTransform: "capitalize" }}>{order.status}</span>
        </Row>
      </div>
    </Card>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3 items-baseline">
      <span className="text-[10px] uppercase tracking-widest text-gray-400">{label}</span>
      <span style={{ color: "var(--color-primary)", lineHeight: 1.7 }}>{children}</span>
    </div>
  )
}
