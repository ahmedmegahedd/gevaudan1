"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { ReturnRequest } from "@/types"

type Tab = "all" | "pending" | "refund" | "exchange"

const STATUS_STYLES: Record<
  ReturnRequest["status"],
  { bg: string; fg: string; label: string }
> = {
  pending: { bg: "#fef3c7", fg: "#b45309", label: "Pending" },
  approved: { bg: "#dcfce7", fg: "#16a34a", label: "Approved" },
  rejected: { bg: "#fee2e2", fg: "#b91c1c", label: "Rejected" },
}

interface Props {
  requests: ReturnRequest[]
}

export default function ReturnsAdminClient({ requests }: Props) {
  const [tab, setTab] = useState<Tab>("all")

  const counts = useMemo(() => {
    const c = {
      total: requests.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      refund: 0,
      exchange: 0,
    }
    for (const r of requests) {
      c[r.status] += 1
      c[r.request_type] += 1
    }
    return c
  }, [requests])

  const visible = useMemo(() => {
    if (tab === "all") return requests
    if (tab === "pending") return requests.filter((r) => r.status === "pending")
    return requests.filter((r) => r.request_type === tab)
  }, [requests, tab])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          Returns &amp; Exchanges
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {counts.total} total · {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <SummaryCard label="Total" value={counts.total} />
        <SummaryCard label="Pending" value={counts.pending} accent="#b45309" />
        <SummaryCard label="Approved" value={counts.approved} accent="#16a34a" />
        <SummaryCard label="Rejected" value={counts.rejected} accent="#b91c1c" />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "pending", "refund", "exchange"] as Tab[]).map((t) => {
          const active = tab === t
          const tabCount =
            t === "all"
              ? counts.total
              : t === "pending"
                ? counts.pending
                : t === "refund"
                  ? counts.refund
                  : counts.exchange
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="text-xs uppercase tracking-wider px-4 h-9 rounded-sm transition-colors"
              style={{
                backgroundColor: active ? "var(--color-primary)" : "#fff",
                color: active ? "#fff" : "var(--color-primary)",
                border: active ? "1px solid var(--color-primary)" : "1px solid #e5e7eb",
              }}
            >
              {t}
              <span
                className="ml-2 text-[10px] tabular-nums"
                style={{ opacity: active ? 0.8 : 0.5 }}
              >
                {tabCount}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="bg-white border rounded-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        {visible.length === 0 ? (
          <p className="py-16 text-center text-gray-400 text-sm">
            {tab === "all" ? "No requests yet." : `No ${tab} requests.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 900 }}>
              <thead>
                <tr style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Request</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Order</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Items</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Reason</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#f3f4f6" }}>
                {visible.map((r, i) => {
                  const st = STATUS_STYLES[r.status]
                  const itemsCount = Array.isArray(r.items)
                    ? r.items.reduce((s, it) => s + (it.quantity ?? 0), 0)
                    : 0
                  return (
                    <tr
                      key={r.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        window.location.href = `/admin/returns/${r.id}`
                      }}
                    >
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/admin/returns/${r.id}`}
                          className="font-mono text-xs hover:underline"
                          style={{ color: "var(--color-primary)" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          #{r.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/admin/orders/${r.order_id}`}
                          className="font-mono text-xs hover:underline"
                          style={{ color: "var(--color-accent)" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          #{r.order_id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-gray-700">{r.customer_name}</p>
                        <p className="text-xs text-gray-400">{r.customer_phone}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                          style={{
                            backgroundColor:
                              r.request_type === "refund" ? "#e0f2fe" : "#ede9fe",
                            color:
                              r.request_type === "refund" ? "#0369a1" : "#6d28d9",
                          }}
                        >
                          {r.request_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-700 tabular-nums">
                        {itemsCount}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-700 max-w-md">
                        <p className="line-clamp-2 leading-relaxed">{r.reason}</p>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-500 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                          style={{ backgroundColor: st.bg, color: st.fg }}
                        >
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: string
}) {
  return (
    <div
      className="bg-white border rounded-sm px-5 py-4"
      style={{ borderColor: "#e5e7eb" }}
    >
      <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p
        className="text-3xl font-bold"
        style={{
          color: accent ?? "var(--color-primary)",
          fontFamily: "var(--font-heading)",
        }}
      >
        {value.toLocaleString()}
      </p>
    </div>
  )
}
