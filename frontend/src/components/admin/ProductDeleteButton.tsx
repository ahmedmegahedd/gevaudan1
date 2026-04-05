"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { clientApi } from "@/lib/clientApi"

interface Props {
  productId: string
  productName: string
}

export default function ProductDeleteButton({ productId, productName }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return
    setLoading(true)
    await clientApi.deleteProduct(productId)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs uppercase tracking-wider font-medium text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  )
}
