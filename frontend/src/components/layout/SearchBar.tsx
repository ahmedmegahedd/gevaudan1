"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { storeConfig } from "@/config/store.config"
import type { Product } from "@/types"

interface SearchBarProps {
  /** "inline" = desktop expanding input; "dropdown" = full-width mobile panel */
  variant: "inline" | "dropdown"
  onClose?: () => void
}

export default function SearchBar({ variant, onClose }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Focus input when mounted
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close suggestions on outside click
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
    if (data) {
      setSuggestions(data as Product[])
      setShowSuggestions(true)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchSuggestions(query), 220)
    return () => clearTimeout(t)
  }, [query, fetchSuggestions])

  function submit(q = query) {
    const trimmed = q.trim()
    if (!trimmed) return
    setShowSuggestions(false)
    onClose?.()
    router.push(`/shop?search=${encodeURIComponent(trimmed)}`)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") submit()
    if (e.key === "Escape") { setShowSuggestions(false); onClose?.() }
  }

  function goToProduct(slug: string) {
    setShowSuggestions(false)
    onClose?.()
    router.push(`/shop/${slug}`)
  }

  const { currency } = storeConfig.delivery

  const inputStyles: React.CSSProperties =
    variant === "inline"
      ? {
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "#fff",
          borderColor: "rgba(255,255,255,0.25)",
        }
      : {
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "#fff",
          borderColor: "rgba(255,255,255,0.2)",
        }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search products…"
            className="w-full h-9 pl-3 pr-8 text-sm border rounded-sm focus:outline-none placeholder:text-white/40 bg-transparent"
            style={inputStyles}
            aria-label="Search products"
          />
          {/* Clear button inside input */}
          {query && (
            <button
              onClick={() => { setQuery(""); setSuggestions([]); setShowSuggestions(false); inputRef.current?.focus() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={() => submit()}
          className="h-9 px-3 text-xs uppercase tracking-wider font-semibold text-white shrink-0 rounded-sm transition-opacity hover:opacity-80"
          style={{ backgroundColor: storeConfig.theme.accentColor }}
          aria-label="Search"
        >
          Search
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white shrink-0"
            aria-label="Close search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Instant suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-sm shadow-xl z-50 overflow-hidden"
          style={{ backgroundColor: "var(--color-primary)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          {suggestions.map((p) => (
            <button
              key={p.id}
              onClick={() => goToProduct(p.slug)}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-white/10 transition-colors"
            >
              <div className="relative w-9 h-12 shrink-0 bg-white/5 overflow-hidden rounded-sm">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="36px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                <p className="text-xs" style={{ color: storeConfig.theme.accentColor }}>
                  {currency} {p.price?.toLocaleString()}
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ))}

          {/* "See all results" footer */}
          <button
            onClick={() => submit()}
            className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 text-xs font-medium border-t transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(255,255,255,0.08)", color: storeConfig.theme.accentColor }}
          >
            <SearchIcon className="h-3.5 w-3.5" />
            See all results for &ldquo;{query}&rdquo;
          </button>
        </div>
      )}
    </div>
  )
}

export function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
    </svg>
  )
}
