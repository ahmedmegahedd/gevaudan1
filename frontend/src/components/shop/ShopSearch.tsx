"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { storeConfig } from "@/config/store.config"
import type { Product } from "@/types"

const { primaryColor, accentColor } = storeConfig.theme
const { currency } = storeConfig.delivery

interface ShopSearchProps {
  initialQuery: string
  activeCategory: string | null
  minPrice: string
  maxPrice: string
}

export default function ShopSearch({ initialQuery, activeCategory, minPrice, maxPrice }: ShopSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, images, price")
      .eq("is_active", true)
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(5)
    if (data) { setSuggestions(data as Product[]); setShowSuggestions(true) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchSuggestions(query), 220)
    return () => clearTimeout(t)
  }, [query, fetchSuggestions])

  function buildUrl(search: string) {
    const params = new URLSearchParams()
    if (search.trim()) params.set("search", search.trim())
    if (activeCategory) params.set("category", activeCategory)
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)
    return `/shop${params.size ? `?${params}` : ""}`
  }

  function submit(q = query) {
    setShowSuggestions(false)
    router.push(buildUrl(q))
  }

  function clear() {
    setQuery("")
    setSuggestions([])
    setShowSuggestions(false)
    router.push(buildUrl(""))
    inputRef.current?.focus()
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") submit()
    if (e.key === "Escape") setShowSuggestions(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex items-center overflow-hidden card-shadow rounded-card"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Magnifier icon */}
        <span className="pl-5 shrink-0" style={{ color: primaryColor }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); }}
          onKeyDown={onKey}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Search products…"
          className="flex-1 h-12 px-4 text-base focus:outline-none bg-transparent"
          style={{ color: primaryColor }}
          aria-label="Search products"
        />

        {query && (
          <button
            onClick={clear}
            className="px-3 hover:opacity-70"
            style={{ color: "rgba(42,61,46,0.4)" }}
            aria-label="Clear"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <button
          onClick={() => submit()}
          className="h-12 px-6 text-[11px] uppercase font-medium text-white shrink-0 hover:opacity-85"
          style={{ backgroundColor: primaryColor, letterSpacing: "0.18em" }}
        >
          Search
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-40 overflow-hidden card-shadow rounded-card"
          style={{ backgroundColor: "#ffffff" }}
        >
          {suggestions.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { setShowSuggestions(false); router.push(`/shop/${p.slug}`) }}
              className="flex items-center gap-4 w-full px-4 py-3 text-left hover:bg-[rgba(168,200,224,0.3)]"
              style={i > 0 ? { borderTop: "1px solid var(--divider-soft)" } : undefined}
            >
              <div className="relative w-10 h-14 shrink-0 overflow-hidden rounded-[2px]" style={{ backgroundColor: "#DCD2BD" }}>
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="40px" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm truncate"
                  style={{
                    color: primaryColor,
                    fontFamily: "var(--font-heading)",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                  }}
                >
                  {p.name}
                </p>
                <p className="price-text text-sm" style={{ color: accentColor }}>
                  {currency} {p.price?.toLocaleString()}
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "rgba(42,61,46,0.3)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ))}

          <button
            onClick={() => submit()}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-[11px] uppercase font-medium hover:bg-[rgba(168,200,224,0.3)]"
            style={{
              borderTop: "1px solid var(--divider-soft)",
              color: accentColor,
              letterSpacing: "0.15em",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
            </svg>
            See all results for &ldquo;{query}&rdquo;
          </button>
        </div>
      )}
    </div>
  )
}
