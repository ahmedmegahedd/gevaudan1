"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { clientApi } from "@/lib/clientApi"

interface Props {
  productId: string
  isActive: boolean
}

export default function ProductActiveToggle({ productId, isActive }: Props) {
  const [active, setActive] = useState(isActive)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function toggle() {
    setSaving(true)
    await clientApi.toggleActive(productId, !active)
    setActive((v) => !v)
    setSaving(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      aria-label={active ? "Deactivate product" : "Activate product"}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
      style={{ backgroundColor: active ? "var(--color-accent)" : "#d1d5db" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow"
        style={{ transform: active ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  )
}
