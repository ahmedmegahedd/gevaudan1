"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ProductCard from "@/components/shop/ProductCard"
import ShopFilters from "@/components/shop/ShopFilters"
import ShopSearch from "@/components/shop/ShopSearch"
import { storeConfig } from "@/config/store.config"
import type { Product, Category } from "@/types"

const { primaryColor, accentColor } = storeConfig.theme

interface ShopPageClientProps {
  products: Product[]
  categories: Category[]
  activeCategory: string | null
  minPrice: string
  maxPrice: string
  currency: string
  searchQuery: string
}

export default function ShopPageClient({
  products,
  categories,
  activeCategory,
  minPrice,
  maxPrice,
  currency,
  searchQuery,
}: ShopPageClientProps) {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const router = useRouter()

  function clearSearch() {
    const params = new URLSearchParams()
    if (activeCategory) params.set("category", activeCategory)
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)
    router.push(`/shop${params.size ? `?${params}` : ""}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between mb-6 md:hidden">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          Shop
        </h1>
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className="flex items-center gap-2 px-4 h-11 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: primaryColor, color: accentColor }}
          aria-label="Open filters"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Filters
        </button>
      </div>

      {/* Mobile filter drawer overlay */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFilterDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-4/5 max-w-xs overflow-y-auto px-4 py-6 flex flex-col" style={{ backgroundColor: primaryColor }}>
            <ShopFilters
              categories={categories}
              activeCategory={activeCategory}
              minPrice={minPrice}
              maxPrice={maxPrice}
              currency={currency}
              onClose={() => setFilterDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop layout: sidebar + grid */}
      <div className="flex flex-col md:flex-row gap-10">
        {/* Filters sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <h1
            className="text-4xl font-bold mb-8"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            Shop
          </h1>
          <div className="rounded-sm px-4 py-5" style={{ backgroundColor: primaryColor }}>
            <ShopFilters
              categories={categories}
              activeCategory={activeCategory}
              minPrice={minPrice}
              maxPrice={maxPrice}
              currency={currency}
            />
          </div>
        </aside>

        {/* Product grid */}
        <section className="flex-1">
          {/* Search bar */}
          <div className="mb-5">
            <ShopSearch initialQuery={searchQuery} activeCategory={activeCategory} minPrice={minPrice} maxPrice={maxPrice} />
          </div>

          {/* Search result banner */}
          {searchQuery && (
            <div
              className="flex items-center justify-between mb-5 px-4 py-3 rounded-sm"
              style={{ backgroundColor: "rgba(68,119,148,0.08)", borderLeft: "3px solid var(--color-accent)" }}
            >
              <p className="text-sm" style={{ color: "var(--color-primary)" }}>
                Showing results for:{" "}
                <span className="font-semibold" style={{ color: "var(--color-accent)" }}>
                  &ldquo;{searchQuery}&rdquo;
                </span>
                <span className="text-gray-400 ml-2">({products.length} {products.length === 1 ? "result" : "results"})</span>
              </p>
              <button
                onClick={clearSearch}
                className="flex items-center gap-1 text-xs font-medium ml-4 shrink-0 hover:opacity-70 transition-opacity"
                style={{ color: "var(--color-accent)" }}
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            </div>
          )}

          {!products || products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-500 mb-4">
                {searchQuery ? `No products found for "${searchQuery}".` : "No products found."}
              </p>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="text-sm underline"
                  style={{ color: "var(--color-accent)" }}
                >
                  Clear search and browse all products
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
