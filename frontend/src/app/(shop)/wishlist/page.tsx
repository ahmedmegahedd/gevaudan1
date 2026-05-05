"use client"

import Link from "next/link"
import { useWishlistStore } from "@/store/wishlistStore"
import { storeConfig } from "@/config/store.config"
import ProductCard from "@/components/shop/ProductCard"

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items)

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-12 md:py-24">
      {/* Header */}
      <div className="mb-12 md:mb-16 text-center">
        <h1
          className="text-[36px] md:text-[56px] mb-4"
          style={{
            color: "var(--color-primary)",
            fontFamily: "var(--font-heading)",
            fontWeight: 500,
            letterSpacing: "0.02em",
            lineHeight: 1.1,
          }}
        >
          Wishlist
        </h1>
        {items.length > 0 && (
          <p
            className="text-[11px] uppercase"
            style={{ color: "rgba(61,20,25,0.5)", letterSpacing: "0.2em" }}
          >
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 md:py-32 gap-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-20 w-20 opacity-20"
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
              className="text-2xl md:text-3xl mb-3"
              style={{
                color: "var(--color-primary)",
                fontFamily: "var(--font-heading)",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Your wishlist is empty
            </p>
            <p
              className="text-base"
              style={{ color: "rgba(61,20,25,0.5)", lineHeight: 1.8 }}
            >
              Save items you love and come back to them anytime.
            </p>
          </div>
          <Link href="/shop" className="luxe-solid-btn">
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  )
}
