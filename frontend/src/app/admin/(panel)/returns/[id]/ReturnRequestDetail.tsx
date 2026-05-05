"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { clientApi } from "@/lib/clientApi"
import { useToastStore } from "@/store/toastStore"
import type { ReturnRequestStatus } from "@/types"

interface Props {
  id: string
  initialStatus: ReturnRequestStatus
  initialNotes: string
}

export default function ReturnRequestDetail({ id, initialStatus, initialNotes }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [status, setStatus] = useState<ReturnRequestStatus>(initialStatus)
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const trimmed = notes.trim()
    const { error } = await clientApi.updateReturnRequest(id, {
      status,
      admin_notes: trimmed === "" ? null : trimmed,
    })
    setSaving(false)
    if (error) {
      useToastStore.getState().addToast(error, "error")
      return
    }
    useToastStore.getState().addToast("Request updated", "success")
    startTransition(() => router.refresh())
  }

  const dirty = status !== initialStatus || notes !== initialNotes

  return (
    <div className="bg-white border rounded-sm p-5 space-y-5" style={{ borderColor: "#e5e7eb" }}>
      <h2
        className="text-xs uppercase tracking-widest font-semibold text-gray-400 pb-3 border-b"
        style={{ borderColor: "#f3f4f6" }}
      >
        Manage Request
      </h2>

      <div className="space-y-2">
        <label
          className="block text-[11px] uppercase font-medium"
          style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
        >
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ReturnRequestStatus)}
          className="w-full border px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--color-accent)] min-h-[44px]"
          style={{ borderColor: "#d1d5db" }}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-2">
        <label
          className="block text-[11px] uppercase font-medium"
          style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
        >
          Admin Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Internal notes — visible only to admins…"
          className="w-full border px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--color-accent)]"
          style={{ borderColor: "#d1d5db", resize: "vertical" }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !dirty}
        className="w-full text-[11px] uppercase font-medium text-white hover:opacity-85 disabled:opacity-40 rounded-[2px]"
        style={{
          backgroundColor: "var(--color-primary)",
          height: "48px",
          letterSpacing: "0.25em",
        }}
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  )
}
