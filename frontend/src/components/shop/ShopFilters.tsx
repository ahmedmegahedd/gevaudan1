"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { storeConfig } from "@/config/store.config"
import type { Category } from "@/types"

const { accentColor } = storeConfig.theme

interface ShopFiltersProps {
  categories: Category[]
  activeCategory: string | null
  minPrice: string
  maxPrice: string
  currency: string
  /** When provided, component is rendered inside the mobile drawer */
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
  const isMobile = !!onClose

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/shop?${params.toString()}`)
  }

  function setCategory(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) params.set("category", slug)
    else params.delete("category")
    router.push(`/shop?${params.toString()}`)
    onClose?.()
  }

  const dividerColor = "rgba(255,255,255,0.08)"

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-10">
        {/* Mobile drawer header */}
        {isMobile && (
          <div
            className="flex items-center justify-between pb-5"
            style={{ borderBottom: `1px solid ${dividerColor}` }}
          >
            <h2
              className="text-[11px] uppercase font-medium"
              style={{ color: accentColor, letterSpacing: "0.2em" }}
            >
              Filters
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-11 h-11 hover:opacity-70"
              style={{ color: "#fff" }}
              aria-label="Close filters"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Section: Category */}
        <div>
          <p
            className="text-[10px] uppercase font-medium mb-5"
            style={{ color: accentColor, letterSpacing: "0.2em" }}
          >
            Category
          </p>
          <ul>
            <CategoryItem
              label="All"
              isActive={activeCategory === null}
              onClick={() => setCategory(null)}
              dividerColor={dividerColor}
              accentColor={accentColor}
            />
            {categories.map((cat) => (
              <CategoryItem
                key={cat.id}
                label={cat.name}
                isActive={activeCategory === cat.slug}
                onClick={() => setCategory(cat.slug)}
                dividerColor={dividerColor}
                accentColor={accentColor}
              />
            ))}
          </ul>
        </div>

        {/* Section: Price */}
        <div>
          <p
            className="text-[10px] uppercase font-medium mb-5"
            style={{ color: accentColor, letterSpacing: "0.2em" }}
          >
            Price ({currency})
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="Min"
              defaultValue={minPrice}
              min={0}
              className="w-full text-sm focus:outline-none"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                padding: "10px 2px",
                minHeight: "44px",
                borderRadius: 0,
              }}
              onBlur={(e) => updateParam("minPrice", e.target.value)}
            />
            <span
              className="shrink-0 text-sm"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              –
            </span>
            <input
              type="number"
              placeholder="Max"
              defaultValue={maxPrice}
              min={0}
              className="w-full text-sm focus:outline-none"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                padding: "10px 2px",
                minHeight: "44px",
                borderRadius: 0,
              }}
              onBlur={(e) => updateParam("maxPrice", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mobile: Apply / Done button pinned to bottom */}
      {isMobile && (
        <div
          className="pt-8 mt-8"
          style={{ borderTop: `1px solid ${dividerColor}` }}
        >
          <button
            onClick={onClose}
            className="w-full text-[11px] uppercase font-medium text-white hover:opacity-85 rounded-[2px]"
            style={{
              backgroundColor: accentColor,
              height: "52px",
              letterSpacing: "0.25em",
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

function CategoryItem({
  label,
  isActive,
  onClick,
  dividerColor,
  accentColor,
}: {
  label: string
  isActive: boolean
  onClick: () => void
  dividerColor: string
  accentColor: string
}) {
  return (
    <li style={{ borderBottom: `1px solid ${dividerColor}` }}>
      <button
        onClick={onClick}
        className="w-full text-left py-4 min-h-[44px] text-sm flex items-center gap-3"
        style={{
          color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
        }}
      >
        <span
          className="shrink-0 w-0.5 h-4 rounded-full"
          style={{
            backgroundColor: isActive ? accentColor : "transparent",
            transition: "background-color 0.3s ease",
          }}
        />
        <span style={{ fontWeight: isActive ? 500 : 400 }}>{label}</span>
      </button>
    </li>
  )
}

