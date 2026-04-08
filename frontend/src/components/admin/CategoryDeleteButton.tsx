"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { clientApi } from "@/lib/clientApi"
import { useToastStore } from "@/store/toastStore"

export default function CategoryDeleteButton({ id, name }: { id: string; name: string }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    const { error } = await clientApi.deleteCategory(id)
    setDeleting(false)
    if (error) {
      useToastStore.getState().addToast("Failed to delete category", "error")
      return
    }
    useToastStore.getState().addToast("Category deleted", "success")
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 px-2">
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
      className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors px-3 py-1.5 border border-red-100 hover:bg-red-50"
      title={`Delete ${name}`}
    >
      Delete
    </button>
  )
}
