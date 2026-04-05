"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { clientApi } from "@/lib/clientApi"
import { useToastStore } from "@/store/toastStore"

export default function CollectionDeleteButton({ id, name }: { id: string; name: string }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    const { error } = await clientApi.deleteCollection(id)
    setDeleting(false)
    if (error) {
      useToastStore.getState().addToast("Failed to delete collection", "error")
      return
    }
    useToastStore.getState().addToast("Collection deleted", "success")
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 px-2 py-2">
        <span className="text-[10px] text-gray-500 hidden sm:block">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider text-red-400 hover:text-red-600 transition-colors hover:bg-red-50"
      title={`Delete ${name}`}
    >
      Delete
    </button>
  )
}
