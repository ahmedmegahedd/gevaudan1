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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-24">
      {/* Centered intro section */}
      <div className="text-center mb-12 md:mb-20">
        <h1
          className="text-[36px] md:text-[56px] mb-4"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-primary)",
            fontWeight: 500,
            letterSpacing: "0.02em",
            lineHeight: 1.1,
          }}
        >
          Shop
        </h1>
        <p
          className="text-base max-w-xl mx-auto"
          style={{ color: "rgba(42,61,46,0.55)", lineHeight: 1.8 }}
        >
          Browse our complete collection — every piece chosen with intention.
        </p>
      </div>

      {/* Mobile filter button */}
      <div className="flex items-center justify-end mb-8 md:hidden">
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className="flex items-center gap-2 px-5 h-11 text-[11px] uppercase font-medium hover:opacity-85 rounded-[2px]"
          style={{
            backgroundColor: primaryColor,
            color: "#ffffff",
            letterSpacing: "0.18em",
          }}
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
          <div
            className="absolute inset-y-0 left-0 w-4/5 max-w-xs overflow-y-auto px-6 py-8 flex flex-col"
            style={{ backgroundColor: primaryColor }}
          >
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
      <div className="flex flex-col md:flex-row gap-12 md:gap-16">
        {/* Filters sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div
            className="rounded-card px-6 py-8 card-shadow"
            style={{ backgroundColor: primaryColor }}
          >
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
          <div className="mb-8">
            <ShopSearch initialQuery={searchQuery} activeCategory={activeCategory} minPrice={minPrice} maxPrice={maxPrice} />
          </div>

          {/* Search result banner */}
          {searchQuery && (
            <div
              className="flex items-center justify-between mb-8 px-5 py-4 rounded-card"
              style={{
                backgroundColor: "rgba(68,119,148,0.08)",
                borderLeft: "2px solid var(--color-accent)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--color-primary)" }}>
                Showing results for:{" "}
                <span style={{ color: "var(--color-accent)", fontWeight: 500 }}>
                  &ldquo;{searchQuery}&rdquo;
                </span>
                <span className="ml-2" style={{ color: "rgba(42,61,46,0.4)" }}>
                  ({products.length} {products.length === 1 ? "result" : "results"})
                </span>
              </p>
              <button
                onClick={clearSearch}
                className="flex items-center gap-1 text-[11px] uppercase font-medium ml-4 shrink-0 hover:opacity-70"
                style={{ color: "var(--color-accent)", letterSpacing: "0.15em" }}
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
            <div className="py-24 text-center">
              <p
                className="text-base mb-6"
                style={{ color: "rgba(42,61,46,0.5)", lineHeight: 1.8 }}
              >
                {searchQuery ? `No products found for "${searchQuery}".` : "No products found."}
              </p>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="text-sm underline"
                  style={{ color: accentColor }}
                >
                  Clear search and browse all products
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
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
