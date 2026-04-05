"use client"

import { useState } from "react"
import ProductCard from "@/components/shop/ProductCard"
import ShopFilters from "@/components/shop/ShopFilters"
import type { Product, Category } from "@/types"

interface ShopPageClientProps {
  products: Product[]
  categories: Category[]
  activeCategory: string | null
  minPrice: string
  maxPrice: string
  currency: string
}

export default function ShopPageClient({
  products,
  categories,
  activeCategory,
  minPrice,
  maxPrice,
  currency,
}: ShopPageClientProps) {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

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
          className="flex items-center gap-2 px-4 h-11 border text-sm font-medium transition-colors"
          style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFilterDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 w-4/5 max-w-xs bg-white overflow-y-auto px-4 py-6">
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
        {/* Desktop heading */}
        <div className="hidden md:block">
          {/* intentionally empty — heading shows below for desktop */}
        </div>

        {/* Filters sidebar — hidden on mobile, shown on md+ */}
        <aside className="hidden md:block w-56 shrink-0">
          <h1
            className="text-4xl font-bold mb-8"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            Shop
          </h1>
          <ShopFilters
            categories={categories}
            activeCategory={activeCategory}
            minPrice={minPrice}
            maxPrice={maxPrice}
            currency={currency}
          />
        </aside>

        {/* Product grid — always visible, full width on mobile */}
        <section className="flex-1">
          {!products || products.length === 0 ? (
            <p className="text-gray-500 py-20 text-center">No products found.</p>
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
