"use client"

import Link from "next/link"
import Image from "next/image"
import { storeConfig } from "@/config/store.config"
import { useCartStore } from "@/store/cartStore"
import { useWishlistStore } from "@/store/wishlistStore"
import { useToastStore } from "@/store/toastStore"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist)
  const wishlisted = useWishlistStore((s) => s.items.some((p) => p.id === product.id))
  const { currency } = storeConfig.delivery

  const mainImage = product.images[0] ?? null

  function handleToggleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    toggleWishlist(product)
  }

  const outOfStock = product.stock === 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (outOfStock) return
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
      <div className="relative aspect-[3/4] overflow-hidden mb-3" style={{ backgroundColor: "#a8c8e0" }}>
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-500 ${outOfStock ? "grayscale opacity-70" : "group-hover:scale-105"}`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-300 text-xs">No image</span>
          </div>
        )}

        {/* Out of stock badge */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-end justify-center pb-4">
            <span className="bg-black/60 text-white text-xs uppercase tracking-widest font-semibold px-3 py-1.5">
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist heart — top-right */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-transform hover:scale-110 z-10"
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <HeartIcon filled={wishlisted} color={storeConfig.theme.accentColor} />
        </button>

        {/* Always-visible add to cart button on mobile (bottom-right corner) */}
        {!outOfStock && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 w-10 h-10 flex items-center justify-center text-white md:hidden rounded-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
            aria-label={`Add ${product.name} to cart`}
          >
            <CartIconSmall />
          </button>
        )}

        {/* Desktop hover overlay */}
        {outOfStock ? (
          <div className="absolute bottom-0 left-0 right-0 py-3 text-xs uppercase tracking-widest font-semibold text-white/70 text-center opacity-0 group-hover:opacity-100 transition-opacity hidden md:block bg-black/50">
            Out of Stock
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-0 left-0 right-0 py-3 text-xs uppercase tracking-widest font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
            style={{ backgroundColor: "var(--color-primary)" }}
            aria-label={`Add ${product.name} to cart`}
          >
            Add to Cart
          </button>
        )}
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
        <ColorSwatches variants={product.variants} />
        <p className="text-base font-semibold" style={{ color: "var(--color-accent)" }}>
          {currency} {product.price.toLocaleString()}
        </p>
      </div>
    </Link>
  )
}

/** Returns true if the string is a hex code or a recognised CSS named color. */
function isValidCssColor(value: string): boolean {
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return true
  if (/^rgb/i.test(value) || /^hsl/i.test(value)) return true
  // Test against the browser's CSS parser (SSR-safe guard)
  if (typeof document === "undefined") return false
  const el = document.createElement("div")
  el.style.color = ""
  el.style.color = value
  return el.style.color !== ""
}

/** Neutral swatches for names that can't be resolved to a CSS color */
const NEUTRAL_SWATCH = "#c8c4bc"

function ColorSwatches({ variants }: { variants: Record<string, string[]> }) {
  // Find all color-like keys (case-insensitive, supports color/colour)
  const colorKey = Object.keys(variants).find((k) => /colou?r/i.test(k))
  if (!colorKey) return null

  const colors = variants[colorKey]
  if (!colors || colors.length === 0) return null

  const MAX = 4
  const visible = colors.slice(0, MAX)
  const overflow = colors.length - MAX

  return (
    <div className="flex items-center" style={{ gap: 4, marginTop: 2, marginBottom: 2 }}>
      {visible.map((color) => {
        const resolved = isValidCssColor(color) ? color : NEUTRAL_SWATCH
        const needsTooltip = resolved === NEUTRAL_SWATCH
        return (
          <span
            key={color}
            title={needsTooltip ? color : undefined}
            style={{
              display: "inline-block",
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: resolved,
              border: `1.5px solid rgba(0,0,0,0.15)`,
              flexShrink: 0,
              cursor: needsTooltip ? "default" : undefined,
            }}
            aria-label={color}
          />
        )
      })}
      {overflow > 0 && (
        <span
          className="text-[10px] font-medium leading-none"
          style={{ color: "var(--color-accent)" }}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}

function HeartIcon({ filled, color }: { filled: boolean; color: string }) {
  return filled ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill={color}>
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
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
