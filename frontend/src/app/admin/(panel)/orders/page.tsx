import Link from "next/link"
import { serverApi } from "@/lib/serverApi"
import { storeConfig } from "@/config/store.config"
import OrderCard from "@/components/admin/OrderCard"
import { formatOrderNumber } from "@/lib/orderNumber"
import type { OrderStatus } from "@/types"

export const dynamic = "force-dynamic"

export const metadata = { title: "Orders" }

const statusColors: Record<OrderStatus, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  delivered: "#10b981",
  cancelled: "#ef4444",
}

export default async function AdminOrdersPage() {
  const { currency } = storeConfig.delivery
  const orders = await serverApi.orders()

  return (
    <div className="max-w-7xl mx-auto">
      <h1
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
      >
        Orders
      </h1>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {orders?.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            currency={currency}
            statusColors={statusColors}
          />
        ))}
        {(!orders || orders.length === 0) && (
          <p className="text-center text-gray-400 py-12">No orders yet.</p>
        )}
      </div>

      {/* Desktop: table */}
      <div
        className="hidden md:block bg-white border overflow-x-auto"
        style={{ borderColor: "#e5e7eb" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
              {["Order ID", "Customer", "Phone", "City", "Items", "Total", "Status", "Date", ""].map(
                (h, i) => (
                  <th
                    key={i}
                    className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-gray-400"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {orders?.map((order) => {
              const isPending = order.status === "pending"
              return (
                <tr
                  key={order.id}
                  className="border-b last:border-0 transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: "#e5e7eb",
                    backgroundColor: isPending ? "#fffbeb" : undefined,
                  }}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {formatOrderNumber(order.order_number)}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-primary)" }}>
                    {order.customer_info.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <a
                      href={`tel:${order.customer_info.phone}`}
                      className="hover:underline"
                    >
                      {order.customer_info.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{order.delivery_address.city}</td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {order.items.length}
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: "var(--color-accent)" }}>
                    {currency} {order.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full capitalize"
                      style={{
                        backgroundColor: `${statusColors[order.status]}18`,
                        color: statusColors[order.status],
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs font-semibold uppercase tracking-wider transition-colors hover:opacity-70 whitespace-nowrap"
                      style={{ color: "var(--color-accent)" }}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              )
            })}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
