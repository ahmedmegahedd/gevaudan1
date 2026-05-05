"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { storeConfig } from "@/config/store.config"
import { useCartStore } from "@/store/cartStore"
import { useWishlistStore } from "@/store/wishlistStore"
import { useToastStore } from "@/store/toastStore"
import Stars from "@/components/shop/Stars"
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
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const displayImage = previewImage ?? mainImage

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
      className="group flex flex-col rounded-card overflow-hidden card-shadow"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Image */}
      <div
        className="relative aspect-[3/4] overflow-hidden"
        style={{ backgroundColor: "#E0D5C2" }}
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className={`object-cover ${outOfStock ? "grayscale opacity-70" : "group-hover:scale-105"}`}
            style={{ transition: "transform 0.4s ease" }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-300 text-xs">No image</span>
          </div>
        )}

        {/* Out of stock badge */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-end justify-center pb-5">
            <span
              className="bg-black/60 text-white text-[10px] uppercase font-medium px-4 py-2"
              style={{ letterSpacing: "0.18em" }}
            >
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist heart — top-right */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:scale-110 z-10"
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <HeartIcon filled={wishlisted} color={storeConfig.theme.accentColor} />
        </button>

        {/* Always-visible add to cart button on mobile (bottom-right corner) */}
        {!outOfStock && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center text-white md:hidden rounded-[2px]"
            style={{ backgroundColor: "var(--color-primary)" }}
            aria-label={`Add ${product.name} to cart`}
          >
            <CartIconSmall />
          </button>
        )}

        {/* Desktop hover overlay — Add to Cart */}
        {outOfStock ? (
          <div
            className="absolute bottom-0 left-0 right-0 py-4 text-[11px] uppercase font-medium text-white/70 text-center opacity-0 group-hover:opacity-100 hidden md:block bg-black/55"
            style={{ letterSpacing: "0.18em" }}
          >
            Out of Stock
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-0 left-0 right-0 py-4 text-[11px] uppercase font-medium text-white opacity-0 group-hover:opacity-100 hidden md:block"
            style={{ backgroundColor: "var(--color-primary)", letterSpacing: "0.18em" }}
            aria-label={`Add ${product.name} to cart`}
          >
            Add to Cart
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-6">
        <p
          className="text-[10px] uppercase font-medium"
          style={{ color: "var(--color-mid1)", letterSpacing: "0.15em" }}
        >
          {product.category?.name}
        </p>
        <h3
          className="text-lg leading-snug"
          style={{
            color: "var(--color-primary)",
            fontFamily: "var(--font-heading)",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          {product.name}
        </h3>
        {typeof product.review_count === "number" && product.review_count > 0 && (
          <div className="flex items-center gap-2">
            <Stars
              value={product.avg_rating ?? 0}
              size={12}
              ariaLabelValue={product.avg_rating ?? 0}
            />
            <span
              className="text-xs"
              style={{ color: "rgba(61,20,25,0.5)" }}
            >
              ({product.review_count})
            </span>
          </div>
        )}
        <ColorSwatches
          variants={product.variants}
          colorImages={product.color_images ?? {}}
          stockByVariant={product.stock_by_variant ?? {}}
          onPreview={setPreviewImage}
        />
        <p
          className="price-text text-xl mt-1"
          style={{ color: "var(--color-accent)" }}
        >
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

interface ColorSwatchesProps {
  variants: Record<string, string[]>
  colorImages: Record<string, string>
  stockByVariant: Record<string, number>
  onPreview: (url: string | null) => void
}

function ColorSwatches({ variants, colorImages, stockByVariant, onPreview }: ColorSwatchesProps) {
  const [active, setActive] = useState<string | null>(null)
  const colorKey = Object.keys(variants).find((k) => /colou?r/i.test(k))
  if (!colorKey) return null

  const colors = variants[colorKey]
  if (!colors || colors.length === 0) return null

  const MAX = 4
  const visible = colors.slice(0, MAX)
  const overflow = colors.length - MAX

  function isOOS(color: string): boolean {
    return stockByVariant[color] === 0
  }

  function handleClick(e: React.MouseEvent, color: string) {
    e.preventDefault()
    e.stopPropagation()
    if (isOOS(color)) return
    const img = colorImages[color]
    if (!img) return
    if (active === color) {
      // toggle off — go back to main image
      setActive(null)
      onPreview(null)
    } else {
      setActive(color)
      onPreview(img)
    }
  }

  function handleMouseEnter(color: string) {
    if (isOOS(color)) return
    const img = colorImages[color]
    if (img) onPreview(img)
  }

  function handleMouseLeave() {
    // restore to the clicked/active color, or main image
    if (active && colorImages[active]) {
      onPreview(colorImages[active])
    } else {
      onPreview(null)
    }
  }

  return (
    <div className="flex items-center" style={{ gap: 6, marginTop: 2, marginBottom: 2 }}>
      {visible.map((color) => {
        const resolved = isValidCssColor(color) ? color : NEUTRAL_SWATCH
        const hasImage = !!colorImages[color]
        const isActive = active === color
        const oos = isOOS(color)
        return (
          <button
            key={color}
            type="button"
            title={oos ? "Out of stock" : color}
            onClick={(e) => handleClick(e, color)}
            onMouseEnter={() => handleMouseEnter(color)}
            onMouseLeave={handleMouseLeave}
            aria-label={oos ? `${color} — out of stock` : color}
            aria-disabled={oos || undefined}
            disabled={oos}
            className={oos ? "swatch-oos" : undefined}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: resolved,
              border: isActive ? `2px solid var(--color-accent)` : `1px solid rgba(61,20,25,0.1)`,
              flexShrink: 0,
              cursor: oos ? "not-allowed" : hasImage ? "pointer" : "default",
              outline: "none",
              padding: 0,
            }}
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
