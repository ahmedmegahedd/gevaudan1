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
        className="flex items-center border overflow-hidden"
        style={{ borderColor: primaryColor }}
      >
        {/* Magnifier icon */}
        <span className="pl-3 shrink-0" style={{ color: primaryColor }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          className="flex-1 h-11 px-3 text-sm focus:outline-none bg-[#d4e9f7]"
          style={{ color: primaryColor }}
          aria-label="Search products"
        />

        {query && (
          <button onClick={clear} className="px-2 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Clear">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <button
          onClick={() => submit()}
          className="h-11 px-5 text-xs uppercase tracking-wider font-semibold text-white shrink-0 transition-opacity hover:opacity-80"
          style={{ backgroundColor: primaryColor }}
        >
          Search
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-40 shadow-xl overflow-hidden border"
          style={{ backgroundColor: "#d4e9f7", borderColor: "#e5e7eb" }}
        >
          {suggestions.map((p) => (
            <button
              key={p.id}
              onClick={() => { setShowSuggestions(false); router.push(`/shop/${p.slug}`) }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-[#a8c8e0] transition-colors border-b last:border-0"
              style={{ borderColor: "#f3f4f6" }}
            >
              <div className="relative w-9 h-12 shrink-0 overflow-hidden" style={{ backgroundColor: "#a8c8e0" }}>
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="36px" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: primaryColor }}>{p.name}</p>
                <p className="text-xs font-semibold" style={{ color: accentColor }}>
                  {currency} {p.price?.toLocaleString()}
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ))}

          <button
            onClick={() => submit()}
            className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 text-xs font-medium border-t hover:bg-[#a8c8e0] transition-colors"
            style={{ borderColor: "#f3f4f6", color: accentColor }}
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
