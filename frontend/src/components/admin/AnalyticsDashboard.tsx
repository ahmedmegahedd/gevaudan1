"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { storeConfig } from "@/config/store.config"
import type { Order, OrderStatus } from "@/types"

const { currency } = storeConfig.delivery
const { accentColor } = storeConfig.theme

// ── Types ──────────────────────────────────────────────────────

type Preset = "today" | "week" | "month" | "year" | "custom"
type ChartGrouping = "day" | "week" | "month"

interface ChartBucket {
  label: string
  revenue: number
}

interface TopProduct {
  name: string
  units: number
  revenue: number
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  delivered: "#10b981",
  cancelled: "#ef4444",
}

// ── Date helpers ───────────────────────────────────────────────

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function getRange(preset: Preset, customFrom?: string, customTo?: string) {
  const now = new Date()
  const today = startOfDay(now)

  if (preset === "today")
    return { from: today, to: new Date(today.getTime() + 86_400_000 - 1) }

  if (preset === "week") {
    const dow = today.getDay()
    const mon = new Date(today)
    mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
    return { from: mon, to: new Date(mon.getTime() + 7 * 86_400_000 - 1) }
  }

  if (preset === "month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    }
  }

  if (preset === "year") {
    return {
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
    }
  }

  // custom
  return {
    from: customFrom ? startOfDay(new Date(customFrom)) : today,
    to: customTo
      ? new Date(new Date(customTo).getTime() + 86_400_000 - 1)
      : new Date(today.getTime() + 86_400_000 - 1),
  }
}

function daysBetween(from: Date, to: Date) {
  return Math.ceil((to.getTime() - from.getTime()) / 86_400_000)
}

function getGrouping(from: Date, to: Date): ChartGrouping {
  const d = daysBetween(from, to)
  if (d <= 7) return "day"
  if (d <= 31) return "week"
  return "month"
}

function niceMax(n: number): number {
  if (n <= 0) return 100
  const exp = Math.floor(Math.log10(n))
  const pow = Math.pow(10, exp)
  if (n <= pow) return pow
  if (n <= 2 * pow) return 2 * pow
  if (n <= 5 * pow) return 5 * pow
  return 10 * pow
}

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toFixed(0)
}

function buildBuckets(orders: Order[], from: Date, to: Date, grouping: ChartGrouping): ChartBucket[] {
  const buckets: ChartBucket[] = []

  if (grouping === "day") {
    const days = daysBetween(from, to)
    for (let i = 0; i < days; i++) {
      const d = startOfDay(new Date(from.getTime() + i * 86_400_000))
      const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
      const revenue = orders
        .filter((o) => startOfDay(new Date(o.created_at)).getTime() === d.getTime())
        .reduce((s, o) => s + o.total, 0)
      buckets.push({ label, revenue })
    }
  } else if (grouping === "week") {
    const cur = new Date(from)
    while (cur <= to) {
      const wStart = new Date(cur)
      const wEnd = new Date(cur.getTime() + 7 * 86_400_000 - 1)
      const label = wStart.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
      const revenue = orders
        .filter((o) => { const d = new Date(o.created_at); return d >= wStart && d <= wEnd })
        .reduce((s, o) => s + o.total, 0)
      buckets.push({ label, revenue })
      cur.setDate(cur.getDate() + 7)
    }
  } else {
    const cur = new Date(from.getFullYear(), from.getMonth(), 1)
    while (cur <= to) {
      const mStart = new Date(cur)
      const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59)
      const label = mStart.toLocaleDateString("en-GB", { month: "short", year: "2-digit" })
      const revenue = orders
        .filter((o) => { const d = new Date(o.created_at); return d >= mStart && d <= mEnd })
        .reduce((s, o) => s + o.total, 0)
      buckets.push({ label, revenue })
      cur.setMonth(cur.getMonth() + 1)
    }
  }

  return buckets
}

// ── Main dashboard ─────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const preset = (searchParams.get("preset") as Preset) || "month"
  const customFrom = searchParams.get("from") || ""
  const customTo = searchParams.get("to") || ""

  const { from, to } = useMemo(
    () => getRange(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  )

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const supabase = createClient()
    supabase
      .from("orders")
      .select("*")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setOrders((data as Order[]) ?? [])
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [from.toISOString(), to.toISOString()])  // eslint-disable-line react-hooks/exhaustive-deps

  function setParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // ── Metrics (exclude cancelled) ──────────────────────────────
  const active = orders.filter((o) => o.status !== "cancelled")
  const totalRevenue = active.reduce((s, o) => s + o.total, 0)
  const totalOrders = active.length
  const itemsSold = active.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0)
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // ── Chart ─────────────────────────────────────────────────────
  const grouping = getGrouping(from, to)
  const buckets = useMemo(() => buildBuckets(active, from, to, grouping), [orders, grouping]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Status breakdown (all orders) ─────────────────────────────
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {} as Record<OrderStatus, number>)

  // ── Top products ──────────────────────────────────────────────
  const productMap: Record<string, TopProduct> = {}
  for (const order of active) {
    for (const item of order.items) {
      if (!productMap[item.product_id]) {
        productMap[item.product_id] = { name: item.name, units: 0, revenue: 0 }
      }
      productMap[item.product_id].units += item.quantity
      productMap[item.product_id].revenue += item.price * item.quantity
    }
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <h1
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
      >
        Analytics
      </h1>

      {/* Date filter */}
      <DateFilter
        preset={preset}
        customFrom={customFrom}
        customTo={customTo}
        onChange={setParams}
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white border rounded-sm animate-pulse"
              style={{ borderColor: "#e5e7eb", height: 88 }}
            />
          ))}
        </div>
      ) : (
        <>
          <MetricsGrid
            totalRevenue={totalRevenue}
            totalOrders={totalOrders}
            itemsSold={itemsSold}
            aov={aov}
          />
          <RevenueChart buckets={buckets} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusBreakdown statusCounts={statusCounts} total={orders.length} />
            <TopProductsSection products={topProducts} />
          </div>
        </>
      )}
    </div>
  )
}

// ── Date Filter ────────────────────────────────────────────────

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "custom", label: "Custom" },
]

function DateFilter({
  preset,
  customFrom,
  customTo,
  onChange,
}: {
  preset: Preset
  customFrom: string
  customTo: string
  onChange: (p: Record<string, string>) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange({ preset: p.key, from: "", to: "" })}
          className="px-3 py-1.5 text-xs uppercase tracking-wider font-semibold rounded-full border transition-colors"
          style={
            preset === p.key
              ? { backgroundColor: "var(--color-primary)", color: "#fff", borderColor: "var(--color-primary)" }
              : { backgroundColor: "#fff", color: "var(--color-primary)", borderColor: "#d1d5db" }
          }
        >
          {p.label}
        </button>
      ))}

      {preset === "custom" && (
        <div className="flex items-center gap-2 flex-wrap mt-1 sm:mt-0">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onChange({ preset: "custom", from: e.target.value, to: customTo })}
            className="border text-xs px-2 py-1.5 focus:outline-none focus:border-[var(--color-accent)] rounded-sm"
            style={{ borderColor: "#d1d5db" }}
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onChange({ preset: "custom", from: customFrom, to: e.target.value })}
            className="border text-xs px-2 py-1.5 focus:outline-none focus:border-[var(--color-accent)] rounded-sm"
            style={{ borderColor: "#d1d5db" }}
          />
        </div>
      )}
    </div>
  )
}

// ── Metrics Grid ───────────────────────────────────────────────

function MetricsGrid({
  totalRevenue,
  totalOrders,
  itemsSold,
  aov,
}: {
  totalRevenue: number
  totalOrders: number
  itemsSold: number
  aov: number
}) {
  const cards = [
    {
      label: "Total Revenue",
      value: `${currency} ${totalRevenue.toLocaleString()}`,
      accent: true,
    },
    { label: "Total Orders", value: totalOrders.toLocaleString() },
    { label: "Items Sold", value: itemsSold.toLocaleString() },
    {
      label: "Avg Order Value",
      value: `${currency} ${Math.round(aov).toLocaleString()}`,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border rounded-sm p-4 space-y-1"
          style={{
            borderColor: card.accent ? "var(--color-accent)" : "#e5e7eb",
            borderWidth: card.accent ? 2 : 1,
          }}
        >
          <p className="text-xs uppercase tracking-wider text-gray-400">{card.label}</p>
          <p
            className="text-xl sm:text-2xl font-bold"
            style={{
              color: card.accent ? "var(--color-accent)" : "var(--color-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Revenue Chart ──────────────────────────────────────────────

function RevenueChart({ buckets }: { buckets: ChartBucket[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    bucket: ChartBucket
  } | null>(null)

  const BAR_W = 30
  const BAR_GAP = 10
  const PAD_L = 68
  const PAD_R = 20
  const PAD_T = 16
  const PAD_B = 48
  const CHART_H = 180

  const totalW = Math.max(420, PAD_L + buckets.length * (BAR_W + BAR_GAP) - BAR_GAP + PAD_R)
  const totalH = PAD_T + CHART_H + PAD_B

  const maxRev = Math.max(...buckets.map((b) => b.revenue), 0)
  const yMax = niceMax(maxRev)
  const TICKS = 5

  const getBarY = (rev: number) => PAD_T + CHART_H - Math.max(2, (rev / yMax) * CHART_H)
  const getBarH = (rev: number) => Math.max(2, (rev / yMax) * CHART_H)

  function onMouseMove(e: React.MouseEvent<SVGRectElement>, bucket: ChartBucket) {
    const el = containerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setTooltip({ x: e.clientX - r.left, y: e.clientY - r.top, bucket })
  }

  return (
    <div className="bg-white border rounded-sm p-4" style={{ borderColor: "#e5e7eb" }}>
      <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-4">
        Revenue
      </p>

      {buckets.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No data for this period.</p>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <div ref={containerRef} className="relative" style={{ minWidth: totalW }}>
            <svg
              width={totalW}
              height={totalH}
              viewBox={`0 0 ${totalW} ${totalH}`}
            >
              {/* Y grid lines + labels */}
              {Array.from({ length: TICKS + 1 }, (_, i) => {
                const val = (yMax / TICKS) * i
                const y = PAD_T + CHART_H - (val / yMax) * CHART_H
                return (
                  <g key={i}>
                    <line
                      x1={PAD_L} y1={y}
                      x2={totalW - PAD_R} y2={y}
                      stroke="#f3f4f6" strokeWidth={1}
                    />
                    <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
                      {fmtCompact(val)}
                    </text>
                  </g>
                )
              })}

              {/* Y axis line */}
              <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + CHART_H} stroke="#e5e7eb" strokeWidth={1} />

              {/* Bars + X labels */}
              {buckets.map((bucket, i) => {
                const x = PAD_L + i * (BAR_W + BAR_GAP)
                const midX = x + BAR_W / 2
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={getBarY(bucket.revenue)}
                      width={BAR_W}
                      height={getBarH(bucket.revenue)}
                      fill={accentColor}
                      opacity={tooltip?.bucket === bucket ? 1 : 0.78}
                      rx={2}
                      style={{ cursor: "pointer", transition: "opacity 0.1s" }}
                      onMouseMove={(e) => onMouseMove(e, bucket)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    <text
                      x={midX}
                      y={totalH - 6}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#9ca3af"
                      transform={buckets.length > 14 ? `rotate(-40, ${midX}, ${totalH - 6})` : undefined}
                    >
                      {bucket.label}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute pointer-events-none z-20 text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap"
                style={{
                  left: Math.min(tooltip.x + 14, totalW - 140),
                  top: Math.max(tooltip.y - 56, 0),
                  backgroundColor: "var(--color-primary)",
                  color: "#fff",
                }}
              >
                <p className="text-white/60 mb-0.5">{tooltip.bucket.label}</p>
                <p className="font-bold">
                  {currency} {tooltip.bucket.revenue.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Status Breakdown ───────────────────────────────────────────

function StatusBreakdown({
  statusCounts,
  total,
}: {
  statusCounts: Record<OrderStatus, number>
  total: number
}) {
  const statuses: OrderStatus[] = ["pending", "confirmed", "delivered", "cancelled"]

  return (
    <div className="bg-white border rounded-sm p-4 space-y-4" style={{ borderColor: "#e5e7eb" }}>
      <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">
        Orders by Status
      </p>

      {total === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No orders for this period.</p>
      ) : (
        <div className="space-y-4">
          {statuses.map((status) => {
            const count = statusCounts[status] || 0
            const pct = total > 0 ? (count / total) * 100 : 0
            return (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span
                    className="capitalize font-semibold text-xs uppercase tracking-wider"
                    style={{ color: STATUS_COLORS[status] }}
                  >
                    {status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {count} order{count !== 1 ? "s" : ""} &middot;{" "}
                    <span className="font-semibold">{pct.toFixed(0)}%</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: STATUS_COLORS[status],
                      transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Top Products ───────────────────────────────────────────────

function TopProductsSection({ products }: { products: TopProduct[] }) {
  return (
    <div className="bg-white border rounded-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      <div
        className="px-4 py-3 border-b text-xs font-semibold uppercase tracking-wider text-gray-400"
        style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
      >
        Top Products
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-gray-400 p-4 text-center">No sales data for this period.</p>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="divide-y divide-gray-100 md:hidden">
            {products.map((p, i) => (
              <li key={i} className="px-4 py-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span
                      className="text-xs font-bold shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: i === 0 ? accentColor : "#d1d5db" }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-primary)" }}>
                      {p.name}
                    </p>
                  </div>
                  <p className="text-sm font-semibold shrink-0" style={{ color: "var(--color-accent)" }}>
                    {currency} {p.revenue.toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-gray-400 pl-7">{p.units} unit{p.units !== 1 ? "s" : ""} sold</p>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                {["#", "Product", "Units Sold", "Revenue"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-xs uppercase tracking-wider font-semibold text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr
                  key={i}
                  className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: i === 0 ? accentColor : "#d1d5db" }}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-primary)" }}>
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.units}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: "var(--color-accent)" }}>
                    {currency} {p.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
