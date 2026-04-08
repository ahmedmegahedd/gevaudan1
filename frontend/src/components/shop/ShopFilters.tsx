"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { storeConfig } from "@/config/store.config"
import type { Category } from "@/types"

const { primaryColor, accentColor, midColor1 } = storeConfig.theme

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

  const dividerColor = `${midColor1}80` // midColor1 at ~50% opacity

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6">
        {/* Mobile drawer header */}
        {isMobile && (
          <div
            className="flex items-center justify-between pb-4 border-b"
            style={{ borderColor: dividerColor }}
          >
            <h2
              className="text-sm font-semibold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              Filters
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-11 h-11 transition-colors hover:opacity-70"
              style={{ color: "#fff" }}
              aria-label="Close filters"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Desktop sidebar section label */}
        {!isMobile && (
          <p
            className="text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: accentColor, opacity: 0.7 }}
          >
            Category
          </p>
        )}

        {/* Category list */}
        <ul className={isMobile ? "" : "space-y-0"}>
          {/* "All" option */}
          <CategoryItem
            label="All"
            isActive={activeCategory === null}
            onClick={() => setCategory(null)}
            isMobile={isMobile}
            dividerColor={dividerColor}
            accentColor={accentColor}
          />

          {categories.map((cat) => (
            <CategoryItem
              key={cat.id}
              label={cat.name}
              isActive={activeCategory === cat.slug}
              onClick={() => setCategory(cat.slug)}
              isMobile={isMobile}
              dividerColor={dividerColor}
              accentColor={accentColor}
            />
          ))}
        </ul>

        {/* Price range */}
        <div className={isMobile ? "pt-2" : "pt-4"}>
          <p
            className="text-[10px] uppercase tracking-widest font-semibold mb-3"
            style={{ color: accentColor, opacity: isMobile ? 1 : 0.7 }}
          >
            Price ({currency})
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              defaultValue={minPrice}
              min={0}
              className="w-full border px-3 text-sm focus:outline-none focus:border-opacity-100 transition-colors"
              style={{
                borderColor: `${accentColor}60`,
                backgroundColor: isMobile ? "rgba(255,255,255,0.08)" : "#fff",
                color: isMobile ? "#fff" : primaryColor,
                minHeight: "44px",
              }}
              onBlur={(e) => updateParam("minPrice", e.target.value)}
            />
            <span className="shrink-0 text-sm" style={{ color: isMobile ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>–</span>
            <input
              type="number"
              placeholder="Max"
              defaultValue={maxPrice}
              min={0}
              className="w-full border px-3 text-sm focus:outline-none transition-colors"
              style={{
                borderColor: `${accentColor}60`,
                backgroundColor: isMobile ? "rgba(255,255,255,0.08)" : "#fff",
                color: isMobile ? "#fff" : primaryColor,
                minHeight: "44px",
              }}
              onBlur={(e) => updateParam("maxPrice", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mobile: Apply / Done button pinned to bottom */}
      {isMobile && (
        <div className="pt-6 mt-6 border-t" style={{ borderColor: dividerColor }}>
          <button
            onClick={onClose}
            className="w-full py-4 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: accentColor }}
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
  isMobile,
  dividerColor,
  accentColor,
}: {
  label: string
  isActive: boolean
  onClick: () => void
  isMobile: boolean
  dividerColor: string
  accentColor: string
}) {
  if (isMobile) {
    return (
      <li style={{ borderBottom: `0.5px solid ${dividerColor}` }}>
        <button
          onClick={onClick}
          className="w-full text-left px-0 py-3.5 min-h-[44px] text-sm transition-colors flex items-center gap-3"
          style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.65)" }}
        >
          {/* Active left accent bar */}
          <span
            className="shrink-0 w-0.5 h-4 rounded-full transition-all"
            style={{ backgroundColor: isActive ? accentColor : "transparent" }}
          />
          <span style={{ fontWeight: isActive ? 600 : 400 }}>{label}</span>
        </button>
      </li>
    )
  }

  // Desktop sidebar style
  return (
    <li style={{ borderBottom: `0.5px solid ${dividerColor}` }}>
      <button
        onClick={onClick}
        className="w-full text-left py-2.5 min-h-[40px] text-sm transition-colors flex items-center gap-2.5"
        style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.55)" }}
      >
        <span
          className="shrink-0 w-0.5 h-3.5 rounded-full transition-all"
          style={{ backgroundColor: isActive ? accentColor : "transparent" }}
        />
        <span style={{ fontWeight: isActive ? 600 : 400 }}>{label}</span>
      </button>
    </li>
  )
}
