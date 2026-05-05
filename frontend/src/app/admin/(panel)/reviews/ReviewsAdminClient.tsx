"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { clientApi } from "@/lib/clientApi"
import { useToastStore } from "@/store/toastStore"
import Stars from "@/components/shop/Stars"
import type { Review } from "@/types"

type Filter = "all" | "pending" | "approved" | "rejected"

interface Props {
  reviews: Review[]
}

function statusOf(r: Review): "pending" | "approved" | "rejected" {
  if (r.is_approved === true) return "approved"
  if (r.is_approved === false) return "rejected"
  return "pending"
}

const STATUS_STYLES: Record<"pending" | "approved" | "rejected", { bg: string; fg: string; label: string }> = {
  pending: { bg: "#fef3c7", fg: "#b45309", label: "Pending" },
  approved: { bg: "#dcfce7", fg: "#16a34a", label: "Approved" },
  rejected: { bg: "#fee2e2", fg: "#b91c1c", label: "Rejected" },
}

export default function ReviewsAdminClient({ reviews }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("all")
  const [, startTransition] = useTransition()
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())

  const counts = useMemo(() => {
    const c = { all: reviews.length, pending: 0, approved: 0, rejected: 0 }
    for (const r of reviews) c[statusOf(r)] += 1
    return c
  }, [reviews])

  const visible = useMemo(() => {
    if (filter === "all") return reviews
    return reviews.filter((r) => statusOf(r) === filter)
  }, [reviews, filter])

  function setBusy(id: string, v: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev)
      if (v) next.add(id); else next.delete(id)
      return next
    })
  }

  async function setApproval(id: string, status: "approved" | "rejected" | "pending") {
    setBusy(id, true)
    const { error } = await clientApi.setReviewApproval(id, status)
    setBusy(id, false)
    if (error) {
      useToastStore.getState().addToast(error, "error")
      return
    }
    useToastStore.getState().addToast(
      status === "approved"
        ? "Review approved"
        : status === "rejected"
          ? "Review rejected"
          : "Review marked as pending",
      "success"
    )
    startTransition(() => router.refresh())
  }

  async function remove(id: string) {
    if (!confirm("Permanently delete this review?")) return
    setBusy(id, true)
    const { error } = await clientApi.deleteReview(id)
    setBusy(id, false)
    if (error) {
      useToastStore.getState().addToast(error, "error")
      return
    }
    useToastStore.getState().addToast("Review deleted", "info")
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          Reviews
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "pending", "approved", "rejected"] as Filter[]).map((f) => {
          const active = filter === f
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs uppercase tracking-wider px-4 h-9 rounded-sm transition-colors"
              style={{
                backgroundColor: active ? "var(--color-primary)" : "#fff",
                color: active ? "#fff" : "var(--color-primary)",
                border: active ? "1px solid var(--color-primary)" : "1px solid #e5e7eb",
              }}
            >
              {f}
              <span
                className="ml-2 text-[10px] tabular-nums"
                style={{ opacity: active ? 0.8 : 0.5 }}
              >
                {counts[f]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        {visible.length === 0 ? (
          <p className="py-16 text-center text-gray-400 text-sm">
            {filter === "all" ? "No reviews yet." : `No ${filter} reviews.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 900 }}>
              <thead>
                <tr style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Product</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Reviewer</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Rating</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Review</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">Status</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#f3f4f6" }}>
                {visible.map((r, i) => {
                  const st = statusOf(r)
                  const stStyle = STATUS_STYLES[st]
                  const isBusy = busyIds.has(r.id)
                  return (
                    <tr
                      key={r.id}
                      style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}
                    >
                      <td className="px-4 py-3 align-top">
                        {r.product ? (
                          <Link
                            href={`/shop/${r.product.slug}`}
                            target="_blank"
                            className="text-sm hover:underline"
                            style={{
                              color: "var(--color-primary)",
                              fontFamily: "var(--font-heading)",
                              fontWeight: 500,
                            }}
                          >
                            {r.product.name}
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">
                            {r.product_id.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-700">{r.display_name}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <Stars value={r.rating} size={12} ariaLabelValue={r.rating} />
                          <span className="text-xs text-gray-500 tabular-nums">{r.rating}/5</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-700 max-w-md">
                        <p className="line-clamp-3 leading-relaxed">{r.review_text}</p>
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
                          style={{ backgroundColor: stStyle.bg, color: stStyle.fg }}
                        >
                          {stStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {st !== "approved" && (
                              <button
                                onClick={() => setApproval(r.id, "approved")}
                                disabled={isBusy}
                                className="text-[10px] uppercase tracking-wider px-3 h-8 rounded-sm text-white transition-opacity hover:opacity-80 disabled:opacity-40"
                                style={{ backgroundColor: "#16a34a" }}
                              >
                                Approve
                              </button>
                            )}
                            {st !== "rejected" && (
                              <button
                                onClick={() => setApproval(r.id, "rejected")}
                                disabled={isBusy}
                                className="text-[10px] uppercase tracking-wider px-3 h-8 rounded-sm text-white transition-opacity hover:opacity-80 disabled:opacity-40"
                                style={{ backgroundColor: "#b91c1c" }}
                              >
                                Reject
                              </button>
                            )}
                            {st !== "pending" && (
                              <button
                                onClick={() => setApproval(r.id, "pending")}
                                disabled={isBusy}
                                className="text-[10px] uppercase tracking-wider px-3 h-8 rounded-sm transition-colors hover:bg-gray-50"
                                style={{ border: "1px solid #d1d5db", color: "#374151" }}
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => remove(r.id)}
                            disabled={isBusy}
                            className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
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
