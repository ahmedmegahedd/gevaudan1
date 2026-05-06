"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { storeConfig } from "@/config/store.config"
import { useCartStore } from "@/store/cartStore"
import { useWishlistStore } from "@/store/wishlistStore"
import { useAddedToCartStore } from "@/store/addedToCartStore"
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
  const secondaryImage = product.images[1] ?? null
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const displayImage = previewImage ?? mainImage

  function handleToggleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
  }

  // ── Per-color stock + OOS helpers ──
  const stockByVariant: Record<string, number> = product.stock_by_variant ?? {}
  const colorKey = Object.keys(product.variants).find((k) => /colou?r/i.test(k))
  const colorOptions = colorKey ? product.variants[colorKey] ?? [] : []

  function isColorOOS(c: string): boolean {
    return stockByVariant[c] === 0
  }

  // Treat a product as out-of-stock if total stock is 0, OR (when it has
  // colors) every color is explicitly marked OOS in stock_by_variant.
  const allColorsOOS =
    colorOptions.length > 0 && colorOptions.every(isColorOOS)
  const outOfStock = product.stock === 0 || allColorsOOS

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return

    // Quick-add: pick the first IN-STOCK option for each variant. For colors,
    // skip OOS values; for other variants (size, etc.) take the first option.
    const defaultVariants: Record<string, string> = {}
    for (const [key, values] of Object.entries(product.variants)) {
      if (values.length === 0) continue
      if (key === colorKey) {
        const inStock = values.find((v) => !isColorOOS(v))
        if (!inStock) return // belt-and-braces: refuse if no color is available
        defaultVariants[key] = inStock
      } else {
        defaultVariants[key] = values[0]
      }
    }
    addItem(product, defaultVariants, 1)
    useAddedToCartStore.getState().show(product, defaultVariants, 1)
  }

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col"
    >
      {/* ── Image (no card chrome — floats on the page) ── */}
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-[2px]"
        style={{
          backgroundColor: "var(--color-cream-deep)",
          // Hairline border that becomes a touch more present on hover
          boxShadow: "inset 0 0 0 1px rgba(42,61,46,0.06)",
        }}
      >
        {/* Primary image */}
        {displayImage ? (
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className={outOfStock ? "object-cover grayscale opacity-70" : "object-cover"}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-[10px] uppercase"
              style={{ color: "rgba(42,61,46,0.35)", letterSpacing: "0.18em" }}
            >
              No image
            </span>
          </div>
        )}

        {/* Cross-fade to second image on hover (desktop) — only when not previewing a swatch */}
        {!previewImage && secondaryImage && !outOfStock && (
          <Image
            src={secondaryImage}
            alt=""
            aria-hidden="true"
            fill
            className="object-cover opacity-0 group-hover:opacity-100 hidden md:block"
            style={{ transition: "opacity 0.6s ease" }}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}

        {/* Out of stock badge */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-end justify-center pb-6 z-10">
            <span
              className="text-[10px] uppercase font-medium px-4 py-2"
              style={{
                backgroundColor: "rgba(42,61,46,0.85)",
                color: "var(--color-cream)",
                letterSpacing: "0.22em",
              }}
            >
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist heart — top-right, refined */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full z-20 hover:scale-110"
          style={{
            backgroundColor: "rgba(241,233,217,0.92)",
            backdropFilter: "blur(4px)",
          }}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <HeartIcon filled={wishlisted} color="var(--color-primary)" />
        </button>

        {/* ── Quick-add pill ── */}
        {!outOfStock && (
          <div
            className="absolute inset-x-3 bottom-3 z-20 flex justify-center"
            style={{ pointerEvents: "none" }}
          >
            <button
              onClick={handleAddToCart}
              className="quick-add-pill pointer-events-auto opacity-100 md:opacity-0 group-hover:opacity-100 translate-y-0 md:translate-y-2 group-hover:translate-y-0"
              style={{
                transition: "opacity 0.35s ease, transform 0.35s ease",
              }}
              aria-label={`Add ${product.name} to cart`}
            >
              <span className="quick-add-pill-icon">+</span>
              <span className="quick-add-pill-text">Add to Cart</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Info (no card padding — text aligns to image edges) ── */}
      <div className="flex flex-col gap-1.5 pt-4 pb-2 px-1">
        {product.category?.name && (
          <p
            className="text-[10px] uppercase font-medium"
            style={{ color: "var(--color-accent)", letterSpacing: "0.22em" }}
          >
            {product.category.name}
          </p>
        )}

        {/* Name + price on the same line for an editorial layout */}
        <div className="flex items-baseline justify-between gap-3 mt-1">
          <h3
            className="text-base md:text-lg leading-tight truncate"
            style={{
              color: "var(--color-primary)",
              fontFamily: "var(--font-heading)",
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            {product.name}
          </h3>
          <p
            className="price-text text-base md:text-lg whitespace-nowrap"
            style={{ color: "var(--color-primary)" }}
          >
            {currency} {product.price.toLocaleString()}
          </p>
        </div>

        {/* Reviews + swatches stay quietly below */}
        {typeof product.review_count === "number" && product.review_count > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <Stars
              value={product.avg_rating ?? 0}
              size={11}
              ariaLabelValue={product.avg_rating ?? 0}
            />
            <span
              className="text-[10px]"
              style={{ color: "rgba(42,61,46,0.45)", letterSpacing: "0.05em" }}
            >
              ({product.review_count})
            </span>
          </div>
        )}

        <ColorSwatches
          variants={product.variants}
          colorImages={product.color_images ?? {}}
          colorNames={product.color_names ?? {}}
          stockByVariant={product.stock_by_variant ?? {}}
          onPreview={setPreviewImage}
        />
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
  colorNames: Record<string, string>
  stockByVariant: Record<string, number>
  onPreview: (url: string | null) => void
}

function ColorSwatches({ variants, colorImages, colorNames, stockByVariant, onPreview }: ColorSwatchesProps) {
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
        const label = (colorNames[color] ?? "").trim() || color
        return (
          <button
            key={color}
            type="button"
            title={oos ? `${label} — out of stock` : label}
            onClick={(e) => handleClick(e, color)}
            onMouseEnter={() => handleMouseEnter(color)}
            onMouseLeave={handleMouseLeave}
            aria-label={oos ? `${label} — out of stock` : label}
            aria-disabled={oos || undefined}
            disabled={oos}
            className={oos ? "swatch-oos" : undefined}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: resolved,
              border: isActive ? `2px solid var(--color-accent)` : `1px solid rgba(42,61,46,0.1)`,
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
  // Use `style.color` + `currentColor` so CSS-variable values are honored
  // (raw SVG attributes don't resolve `var(--…)`).
  return filled ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ color }}
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      style={{ color }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}

