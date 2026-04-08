"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToastStore } from "@/store/toastStore"

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export default function NewPromoCodePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [minOrder, setMinOrder] = useState("")
  const [maxUses, setMaxUses] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!code.trim()) { setError("Code is required."); return }
    if (!discountValue || Number(discountValue) <= 0) { setError("Discount value must be greater than 0."); return }
    if (discountType === "percentage" && Number(discountValue) > 100) { setError("Percentage cannot exceed 100."); return }

    setSaving(true)
    const supabase = createClient()
    const { error: dbError } = await supabase.from("promo_codes").insert({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order_amount: minOrder ? Number(minOrder) : 0,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      is_active: isActive,
    })

    setSaving(false)

    if (dbError) {
      if (dbError.code === "23505") {
        setError("A promo code with this name already exists.")
      } else {
        setError(dbError.message)
      }
      return
    }

    useToastStore.getState().addToast("Promo code created", "success")
    router.push("/admin/promo-codes")
    router.refresh()
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          New Promo Code
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-sm p-6 space-y-5" style={{ borderColor: "#e5e7eb" }}>
        {/* Code */}
        <div className="space-y-1">
          <label className="block text-sm font-medium" style={{ color: "var(--color-primary)" }}>Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              className="flex-1 border px-3 text-sm font-mono focus:outline-none"
              style={{ borderColor: "#d1d5db", minHeight: "44px" }}
            />
            <button
              type="button"
              onClick={() => setCode(randomCode())}
              className="px-3 text-xs border font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: "#d1d5db", color: "var(--color-accent)", minHeight: "44px" }}
            >
              Random
            </button>
          </div>
        </div>

        {/* Discount type */}
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>Discount Type</p>
          <div className="flex gap-4">
            {(["percentage", "fixed"] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={discountType === t}
                  onChange={() => setDiscountType(t)}
                  className="accent-[var(--color-accent)]"
                />
                <span className="text-sm capitalize text-gray-700">{t === "percentage" ? "Percentage (%)" : "Fixed Amount"}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Discount value */}
        <div className="space-y-1">
          <label className="block text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            Discount Value {discountType === "percentage" ? "(%)" : "(amount)"}
          </label>
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            min={0}
            max={discountType === "percentage" ? 100 : undefined}
            step="0.01"
            placeholder={discountType === "percentage" ? "20" : "50"}
            className="w-full border px-3 text-sm focus:outline-none"
            style={{ borderColor: "#d1d5db", minHeight: "44px" }}
          />
        </div>

        {/* Min order */}
        <div className="space-y-1">
          <label className="block text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            Minimum Order Amount <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            min={0}
            placeholder="0"
            className="w-full border px-3 text-sm focus:outline-none"
            style={{ borderColor: "#d1d5db", minHeight: "44px" }}
          />
        </div>

        {/* Max uses */}
        <div className="space-y-1">
          <label className="block text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            Maximum Uses <span className="text-gray-400 font-normal">(optional — leave blank for unlimited)</span>
          </label>
          <input
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            min={1}
            placeholder="Unlimited"
            className="w-full border px-3 text-sm focus:outline-none"
            style={{ borderColor: "#d1d5db", minHeight: "44px" }}
          />
        </div>

        {/* Expiry */}
        <div className="space-y-1">
          <label className="block text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border px-3 text-sm focus:outline-none"
            style={{ borderColor: "#d1d5db", minHeight: "44px" }}
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>Active</p>
            <p className="text-xs text-gray-400">Code can be used immediately</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: isActive ? "var(--color-accent)" : "#d1d5db" }}
            role="switch"
            aria-checked={isActive}
          >
            <span
              className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: isActive ? "translateX(22px)" : "translateX(2px)" }}
            />
          </button>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {saving ? "Creating…" : "Create Promo Code"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/promo-codes")}
            className="px-4 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
