"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { clientApi } from "@/lib/clientApi"
import { useToastStore } from "@/store/toastStore"
import type { OrderStatus } from "@/types"

const statuses: OrderStatus[] = ["pending", "confirmed", "delivered", "cancelled"]

interface Props {
  orderId: string
  currentStatus: OrderStatus
  statusColors: Record<OrderStatus, string>
}

export default function OrderStatusSelect({ orderId, currentStatus, statusColors }: Props) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as OrderStatus
    setSaving(true)
    await clientApi.updateOrderStatus(orderId, next)
    setStatus(next)
    setSaving(false)
    useToastStore.getState().addToast("Order status updated", "success")
    router.refresh()
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={saving}
      className="text-xs border px-2 py-1 rounded focus:outline-none font-semibold disabled:opacity-50"
      style={{
        borderColor: statusColors[status],
        color: statusColors[status],
      }}
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  )
}
