import { serverApi } from "@/lib/serverApi"
import { storeConfig } from "@/config/store.config"

export const dynamic = "force-dynamic"

export const metadata = { title: "Dashboard" }

export default async function AdminDashboardPage() {
  const { currency } = storeConfig.delivery
  const data = await serverApi.stats()

  const stats = [
    { label: "Total Orders", value: data.totalOrders },
    {
      label: "Pending Orders",
      value: data.pendingOrders,
      highlight: data.pendingOrders > 0,
    },
    { label: "Active Products", value: data.totalProducts },
    {
      label: "Total Revenue",
      value: `${currency} ${data.totalRevenue.toLocaleString()}`,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <h1
        className="text-2xl font-bold mb-6 md:mb-8"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
      >
        Dashboard
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border p-4 sm:p-6 space-y-2"
            style={{
              borderColor: stat.highlight ? "var(--color-accent)" : "#e5e7eb",
              borderWidth: stat.highlight ? 2 : 1,
            }}
          >
            <p className="text-xs uppercase tracking-wider text-gray-400">{stat.label}</p>
            <p
              className="text-2xl sm:text-3xl font-bold"
              style={{
                color: stat.highlight ? "var(--color-accent)" : "var(--color-primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
