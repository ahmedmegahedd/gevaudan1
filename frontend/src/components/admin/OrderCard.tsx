"use client"

import Link from "next/link"
import { formatOrderNumber } from "@/lib/orderNumber"
import type { Order, OrderStatus } from "@/types"

interface Props {
  order: Order
  currency: string
  statusColors: Record<OrderStatus, string>
}

export default function OrderCard({ order, currency, statusColors }: Props) {
  const shortId = formatOrderNumber(order.order_number)
  const isPending = order.status === "pending"

  return (
    <div
      className="bg-white border p-4 space-y-3 rounded-sm"
      style={{
        borderColor: isPending ? "#f59e0b" : "#e5e7eb",
        borderLeftWidth: isPending ? 3 : 1,
      }}
    >
      {/* Top row: name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--color-primary)" }}>
            {order.customer_info.name}
          </p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{shortId}</p>
        </div>
        <span
          className="text-xs font-semibold px-2 py-1 rounded-full capitalize shrink-0"
          style={{
            backgroundColor: `${statusColors[order.status]}18`,
            color: statusColors[order.status],
          }}
        >
          {order.status}
        </span>
      </div>

      {/* Phone + City */}
      <div className="flex justify-between text-sm text-gray-500">
        <a href={`tel:${order.customer_info.phone}`} className="hover:underline">
          {order.customer_info.phone}
        </a>
        <span>{order.delivery_address.city}</span>
      </div>

      {/* Items count + date + total */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-xs text-gray-400">
          {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
          {new Date(order.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span className="font-bold" style={{ color: "var(--color-accent)" }}>
          {currency} {order.total.toLocaleString()}
        </span>
      </div>

      {/* View Details */}
      <Link
        href={`/admin/orders/${order.id}`}
        className="flex items-center justify-center w-full py-2.5 text-xs uppercase tracking-widest font-semibold border transition-colors hover:text-white"
        style={{
          borderColor: "var(--color-primary)",
          color: "var(--color-primary)",
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            "var(--color-primary)"
          ;(e.currentTarget as HTMLAnchorElement).style.color = "#fff"
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = ""
          ;(e.currentTarget as HTMLAnchorElement).style.color =
            "var(--color-primary)"
        }}
      >
        View Details →
      </Link>
    </div>
  )
}
