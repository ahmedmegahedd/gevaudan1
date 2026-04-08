"use client"

import Link from "next/link"
import { useWishlistStore } from "@/store/wishlistStore"
import { storeConfig } from "@/config/store.config"
import ProductCard from "@/components/shop/ProductCard"

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items)

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-3xl md:text-4xl font-bold tracking-wider mb-2"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
        >
          Wishlist
        </h1>
        {items.length > 0 && (
          <p className="text-sm text-gray-500 uppercase tracking-wider">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 opacity-20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
            style={{ color: storeConfig.theme.primaryColor }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <div>
            <p
              className="text-2xl font-semibold mb-2"
              style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
            >
              Your wishlist is empty
            </p>
            <p className="text-gray-500 text-sm">Save items you love and come back to them anytime.</p>
          </div>
          <Link
            href="/shop"
            className="mt-2 px-8 py-3 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: storeConfig.theme.accentColor }}
          >
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  )
}
