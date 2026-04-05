"use client"

import Link from "next/link"
import Image from "next/image"
import { storeConfig } from "@/config/store.config"
import { useCartStore } from "@/store/cartStore"
import { useToastStore } from "@/store/toastStore"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const { currency } = storeConfig.delivery

  const mainImage = product.images[0] ?? null

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    // Add with the first available option for each variant (quick-add from grid)
    const defaultVariants: Record<string, string> = {}
    for (const [key, values] of Object.entries(product.variants)) {
      if (values.length > 0) defaultVariants[key] = values[0]
    }
    addItem(product, defaultVariants, 1)
    useToastStore.getState().addToast("Added to cart", "success")
  }

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-3">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-300 text-xs">No image</span>
          </div>
        )}

        {/* Always-visible add to cart button on mobile (bottom-right corner) */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 w-10 h-10 flex items-center justify-center text-white md:hidden rounded-sm"
          style={{ backgroundColor: "var(--color-primary)" }}
          aria-label={`Add ${product.name} to cart`}
        >
          <CartIconSmall />
        </button>

        {/* Desktop hover overlay */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-0 left-0 right-0 py-3 text-xs uppercase tracking-widest font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
          style={{ backgroundColor: "var(--color-primary)" }}
          aria-label={`Add ${product.name} to cart`}
        >
          Add to Cart
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-1">
        <p className="text-gray-500 uppercase tracking-wider text-xs">
          {product.category?.name}
        </p>
        <h3
          className="text-base font-medium leading-snug"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
        >
          {product.name}
        </h3>
        <p className="text-base font-semibold" style={{ color: "var(--color-accent)" }}>
          {currency} {product.price.toLocaleString()}
        </p>
      </div>
    </Link>
  )
}

function CartIconSmall() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </svg>
  )
}
