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
      <div className="flex items-center gap-1 border border-red-100 px-2 py-2">
        <span className="text-[10px] text-gray-400 mr-1">Sure?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? "…" : "Yes"}
        </button>
        <span className="text-gray-200 mx-1">|</span>
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
      className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors px-3 py-2 border border-red-100 hover:bg-red-50 whitespace-nowrap"
      title={`Delete ${name}`}
    >
      Delete
    </button>
  )
}
