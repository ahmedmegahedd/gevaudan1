"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToastStore } from "@/store/toastStore"
import type { PromoCode } from "@/types"

export default function PromoCodesClient({ codes: initial }: { codes: PromoCode[] }) {
  const [codes, setCodes] = useState(initial)
  const router = useRouter()

  async function toggleActive(code: PromoCode) {
    const supabase = createClient()
    const { error } = await supabase
      .from("promo_codes")
      .update({ is_active: !code.is_active })
      .eq("id", code.id)
    if (error) {
      useToastStore.getState().addToast("Failed to update", "error")
    } else {
      setCodes((prev) => prev.map((c) => c.id === code.id ? { ...c, is_active: !c.is_active } : c))
    }
  }

  async function deleteCode(id: string) {
    if (!confirm("Delete this promo code?")) return
    const supabase = createClient()
    const { error } = await supabase.from("promo_codes").delete().eq("id", id)
    if (error) {
      useToastStore.getState().addToast("Failed to delete", "error")
    } else {
      setCodes((prev) => prev.filter((c) => c.id !== id))
      useToastStore.getState().addToast("Promo code deleted", "success")
      router.refresh()
    }
  }

  if (codes.length === 0) {
    return (
      <div className="bg-white border rounded-sm py-16 text-center" style={{ borderColor: "#e5e7eb" }}>
        <p className="text-gray-400 text-sm mb-4">No promo codes yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
              {["Code", "Type", "Value", "Uses", "Min Order", "Expires", "Active", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "#f3f4f6" }}>
            {codes.map((code, i) => {
              const isExpired = code.expires_at ? new Date(code.expires_at) < new Date() : false
              const isExhausted = code.max_uses !== null && code.times_used >= code.max_uses
              return (
                <tr key={code.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td className="px-4 py-3 font-mono font-semibold" style={{ color: "var(--color-primary)" }}>
                    {code.code}
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{code.discount_type}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: "var(--color-accent)" }}>
                    {code.discount_type === "percentage" ? `${code.discount_value}%` : `${code.discount_value}`}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className={isExhausted ? "text-red-500 font-semibold" : ""}>
                      {code.times_used}{code.max_uses !== null ? ` / ${code.max_uses}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {code.min_order_amount > 0 ? code.min_order_amount : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {code.expires_at ? (
                      <span className={isExpired ? "text-red-500 font-semibold" : ""}>
                        {new Date(code.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(code)}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                      style={{ backgroundColor: code.is_active ? "var(--color-accent)" : "#d1d5db" }}
                      aria-checked={code.is_active}
                      role="switch"
                    >
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                        style={{ transform: code.is_active ? "translateX(18px)" : "translateX(2px)" }}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteCode(code.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
