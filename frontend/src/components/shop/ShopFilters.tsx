"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { Category } from "@/types"

interface ShopFiltersProps {
  categories: Category[]
  activeCategory: string | null
  minPrice: string
  maxPrice: string
  currency: string
  onClose?: () => void
}

export default function ShopFilters({
  categories,
  activeCategory,
  minPrice,
  maxPrice,
  currency,
  onClose,
}: ShopFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/shop?${params.toString()}`)
  }

  function setCategory(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set("category", slug)
    } else {
      params.delete("category")
    }
    router.push(`/shop?${params.toString()}`)
    if (onClose) onClose()
  }

  return (
    <div className="space-y-8">
      {/* Mobile close / apply header */}
      {onClose && (
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--color-primary)" }}>
            Filters
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Close filters"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Category filter */}
      <div>
        <h3 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-3">
          Category
        </h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => setCategory(null)}
              className="w-full text-left py-3 min-h-[44px] text-base md:text-sm transition-colors"
              style={{ color: activeCategory === null ? "var(--color-accent)" : "var(--color-primary)" }}
            >
              All
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => setCategory(cat.slug)}
                className="w-full text-left py-3 min-h-[44px] text-base md:text-sm transition-colors"
                style={{
                  color:
                    activeCategory === cat.slug
                      ? "var(--color-accent)"
                      : "var(--color-primary)",
                  fontWeight: activeCategory === cat.slug ? 600 : 400,
                }}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price range filter */}
      <div>
        <h3 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-3">
          Price ({currency})
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={minPrice}
            min={0}
            className="w-full border rounded px-3 text-base focus:outline-none"
            style={{ borderColor: "var(--color-primary)", minHeight: "48px" }}
            onBlur={(e) => updateParam("minPrice", e.target.value)}
          />
          <span className="text-gray-400 text-sm shrink-0">–</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={maxPrice}
            min={0}
            className="w-full border rounded px-3 text-base focus:outline-none"
            style={{ borderColor: "var(--color-primary)", minHeight: "48px" }}
            onBlur={(e) => updateParam("maxPrice", e.target.value)}
          />
        </div>
      </div>

      {/* Mobile: Apply button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-4 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Apply Filters
        </button>
      )}
    </div>
  )
}
