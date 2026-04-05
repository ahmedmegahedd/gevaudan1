"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { clientApi } from "@/lib/clientApi"
import { useToastStore } from "@/store/toastStore"
import type { OrderStatus } from "@/types"

const statuses: OrderStatus[] = ["pending", "confirmed", "delivered", "cancelled"]

const statusColors: Record<OrderStatus, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  delivered: "#10b981",
  cancelled: "#ef4444",
}

interface Props {
  orderId: string
  currentStatus: OrderStatus
}

export default function OrderStatusForm({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSave() {
    if (status === currentStatus) return
    setSaving(true)
    const { error } = await clientApi.updateOrderStatus(orderId, status)
    setSaving(false)
    if (error) {
      useToastStore.getState().addToast("Failed to update status", "error")
    } else {
      useToastStore.getState().addToast("Status updated", "success")
      router.refresh()
    }
  }

  const changed = status !== currentStatus

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className="flex-1 border px-3 py-2.5 text-sm focus:outline-none rounded-sm"
          style={{
            borderColor: statusColors[status],
            color: statusColors[status],
            fontWeight: 600,
          }}
        >
          {statuses.map((s) => (
            <option key={s} value={s} style={{ color: statusColors[s] }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <button
          onClick={handleSave}
          disabled={saving || !changed}
          className="px-5 py-2.5 text-xs uppercase tracking-widest font-semibold text-white rounded-sm transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--color-primary)", minWidth: 80 }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {changed && (
        <p className="text-xs text-gray-400">
          Changing status from{" "}
          <span style={{ color: statusColors[currentStatus] }} className="font-semibold capitalize">
            {currentStatus}
          </span>{" "}
          to{" "}
          <span style={{ color: statusColors[status] }} className="font-semibold capitalize">
            {status}
          </span>
        </p>
      )}
    </div>
  )
}
