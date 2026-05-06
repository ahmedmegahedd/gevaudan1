"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { storeConfig } from "@/config/store.config"
import { useCartStore } from "@/store/cartStore"
import { getRealVariantKeys, getVariantStock } from "@/lib/variantStock"
import { getVariantValueLabel } from "@/lib/colorNames"
import NotifyMeForm from "@/components/shop/NotifyMeForm"
import type { Product } from "@/types"

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { currency } = storeConfig.delivery
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()

  const images = product.images
  const [activeIndex, setActiveIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const touchStartX = useRef<number | null>(null)

  function prev() {
    setActiveIndex((i) => (i - 1 + images.length) % images.length)
  }
  function next() {
    setActiveIndex((i) => (i + 1) % images.length)
  }
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) { if (delta < 0) next(); else prev() }
    touchStartX.current = null
  }

  // Build initial selected variants — first option for each key
  const variantKeys = Object.keys(product.variants)
  const realKeys = getRealVariantKeys(product.variants)
  const colorKey = variantKeys.find((k) => /colou?r/i.test(k))
  const stockByVariant: Record<string, number> = product.stock_by_variant ?? {}

  function isColorOOS(color: string): boolean {
    return stockByVariant[color] === 0
  }

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const key of variantKeys) {
      const options = product.variants[key]
      // Prefer the first in-stock color, otherwise fall back to the first option
      if (key === colorKey && options.length > 0) {
        initial[key] = options.find((opt) => !isColorOOS(opt)) ?? options[0]
      } else {
        initial[key] = options[0] ?? ""
      }
    }
    return initial
  })

  // Stock for the currently selected variant combination (size + color matrix)
  const combinationStock = getVariantStock(product.stock, product.variant_stock, selectedVariants, realKeys)
  const selectedColor = colorKey ? selectedVariants[colorKey] : null
  const selectedColorOOS = !!selectedColor && isColorOOS(selectedColor)
  const outOfStock = combinationStock === 0 || selectedColorOOS
  // Used for the "Only X left" hint and the quantity stepper bound
  const selectedStock = selectedColorOOS ? 0 : combinationStock

  function handleAddToCart() {
    if (outOfStock) return
    addItem(product, selectedVariants, quantity)
    router.push("/cart")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-24 pb-32 md:pb-24">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-16 lg:gap-20">
        {/* ── Image Gallery (60% on desktop) ── */}
        <div className="md:col-span-3 space-y-5 md:space-y-6">
          {/* Main image */}
          <div
            className="group relative aspect-[3/4] overflow-hidden w-full rounded-card"
            style={{ backgroundColor: "#DCD2BD" }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {images.length > 0 ? (
              <>
                {images.map((img, i) => (
                  <Image
                    key={img}
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    priority={i === 0}
                    className="object-cover transition-opacity duration-300"
                    style={{ opacity: i === activeIndex ? 1 : 0 }}
                    sizes="(max-width: 768px) 100vw, 60vw"
                  />
                ))}

                {/* Arrows — always visible on mobile, hover on desktop */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Previous image"
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Next image"
                    >
                      <ChevronRight />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                No image
              </div>
            )}
          </div>

          {/* Model info */}
          {product.model_info && (
            <div className="flex items-start gap-2 px-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: storeConfig.theme.accentColor }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <p
                className="text-sm italic"
                style={{ color: storeConfig.theme.accentColor, lineHeight: 1.7 }}
              >
                {product.model_info}
              </p>
            </div>
          )}

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i === activeIndex ? "var(--color-accent)" : "transparent",
                    border: `1px solid ${i === activeIndex ? "var(--color-accent)" : "var(--color-primary)"}`,
                    opacity: i === activeIndex ? 1 : 0.4,
                  }}
                />
              ))}
            </div>
          )}

          {/* Thumbnails — horizontal scroll on mobile */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className="relative shrink-0 w-20 md:w-24 aspect-square overflow-hidden rounded-[2px]"
                  style={{
                    boxShadow:
                      i === activeIndex
                        ? `0 0 0 2px var(--color-accent)`
                        : "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info (40% on desktop) ── */}
        <div className="md:col-span-2 space-y-8 md:space-y-10">
          {product.category && (
            <p
              className="text-[11px] uppercase font-medium"
              style={{ color: "var(--color-mid1)", letterSpacing: "0.15em" }}
            >
              {product.category.name}
            </p>
          )}

          <h1
            className="text-[28px] md:text-[40px]"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-primary)",
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: "0.02em",
            }}
          >
            {product.name}
          </h1>

          <p
            className="price-text text-2xl md:text-3xl"
            style={{ color: "var(--color-accent)" }}
          >
            {currency} {product.price.toLocaleString()}
          </p>

          {/* ── Dynamic variant selectors ── */}
          {variantKeys.filter(k => !/^(material|materials|fabric|size_guide)$/i.test(k)).map((key) => (
            <div key={key} className="space-y-4">
              <p
                className="text-[11px] uppercase font-medium"
                style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
              >
                {key}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants[key].map((option) => {
                  const isSelected = selectedVariants[key] === option
                  const isColor = key === colorKey
                  // Combination-level stock (e.g. M|Red) and per-color stock are both consulted
                  const testVariants = { ...selectedVariants, [key]: option }
                  const optionStock = getVariantStock(product.stock, product.variant_stock, testVariants, realKeys)
                  const colorOOS = isColor && isColorOOS(option)
                  const optionOOS = optionStock === 0 || colorOOS
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={optionOOS}
                      aria-disabled={optionOOS || undefined}
                      title={optionOOS ? "Out of stock" : undefined}
                      onClick={() => {
                        if (optionOOS) return
                        setSelectedVariants((prev) => ({ ...prev, [key]: option }))
                        setQuantity(1)
                        // Switch image if this is a color key and a mapping exists
                        if (isColor && product.color_images?.[option]) {
                          const imgUrl = product.color_images[option]
                          const idx = product.images.indexOf(imgUrl)
                          if (idx !== -1) setActiveIndex(idx)
                        }
                      }}
                      className="relative min-h-[48px] min-w-[48px] px-5 py-3 text-sm overflow-hidden rounded-[2px]"
                      style={{
                        border: `1px solid ${isSelected ? "var(--color-primary)" : "rgba(42,61,46,0.15)"}`,
                        backgroundColor: isSelected ? "var(--color-primary)" : "transparent",
                        color: isSelected ? "#fff" : optionOOS ? "rgba(42,61,46,0.25)" : "var(--color-primary)",
                        textDecoration: optionOOS && !isSelected ? "line-through" : "none",
                        letterSpacing: "0.05em",
                        cursor: optionOOS ? "not-allowed" : "pointer",
                      }}
                    >
                      {getVariantValueLabel(product, key, option)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* ── Size Guide ── */}
          {(variantKeys.some((k) => /size/i.test(k)) || product.variants["size_guide"]) && (
            <SizeGuide rawRows={product.variants["size_guide"]} />
          )}

          {/* ── Material & Care ── */}
          <MaterialCare variants={product.variants} />

          {/* ── Quantity — desktop only (mobile uses sticky bar) ── */}
          <div className="hidden md:block space-y-3">
            <p
              className="text-[11px] uppercase font-medium"
              style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
            >
              Quantity
            </p>
            <div
              className="flex items-center w-fit rounded-[2px]"
              style={{ border: "1px solid rgba(42,61,46,0.15)" }}
            >
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-12 h-12 text-lg flex items-center justify-center hover:bg-[#DCD2BD]"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-12 text-center text-base font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(selectedStock, q + 1))}
                disabled={quantity >= selectedStock}
                className="w-12 h-12 text-lg flex items-center justify-center hover:bg-[#DCD2BD] disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* ── Add to Cart + Buy Now — Desktop only ── */}
          <div className="hidden md:flex flex-col gap-3 pt-2">
            {outOfStock ? (
              <>
                <div
                  className="inline-flex items-center justify-center self-start px-4 py-2 rounded-[2px] text-[11px] uppercase font-medium"
                  style={{
                    backgroundColor: "rgba(220,38,38,0.1)",
                    color: "#dc2626",
                    border: "1px solid rgba(220,38,38,0.3)",
                    letterSpacing: "0.18em",
                  }}
                >
                  Out of Stock
                </div>
                <NotifyMeForm
                  productId={product.id}
                  variantInfo={selectedVariants}
                />
              </>
            ) : (
              <>
                <button
                  onClick={handleAddToCart}
                  className="w-full text-[11px] uppercase font-medium text-white hover:opacity-85 rounded-[2px]"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    height: "52px",
                    letterSpacing: "0.25em",
                  }}
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => { handleAddToCart(); router.push("/checkout") }}
                  className="w-full text-[11px] uppercase font-medium hover:bg-[var(--color-primary)] hover:text-white rounded-[2px]"
                  style={{
                    border: "1px solid var(--color-primary)",
                    color: "var(--color-primary)",
                    height: "52px",
                    letterSpacing: "0.25em",
                  }}
                >
                  Buy Now
                </button>
              </>
            )}
          </div>

          {selectedStock > 0 && selectedStock <= 5 && (
            <p className="text-sm" style={{ color: "#dc2626" }}>
              Only {selectedStock} left in stock
            </p>
          )}
        </div>
      </div>

      {/* ── Sticky bottom bar — Mobile only ── */}
      <div
        className="fixed bottom-0 left-0 right-0 md:hidden px-4 pt-3 pb-4 space-y-3 z-40"
        style={{
          backgroundColor: "var(--color-primary)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {outOfStock ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-[2px] text-[10px] uppercase font-medium"
                style={{
                  backgroundColor: "rgba(220,38,38,0.18)",
                  color: "#fca5a5",
                  border: "1px solid rgba(220,38,38,0.4)",
                  letterSpacing: "0.18em",
                }}
              >
                Out of Stock
              </span>
            </div>
            <NotifyMeForm
              productId={product.id}
              variantInfo={selectedVariants}
              variant="dark"
            />
          </div>
        ) : (
          <>
            {/* Row 1: quantity + add to cart */}
            <div className="flex items-center gap-2">
              <div
                className="flex items-center shrink-0 rounded-[2px]"
                style={{ border: "1px solid rgba(255,255,255,0.25)" }}
              >
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 text-lg flex items-center justify-center text-white hover:bg-white/10"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(selectedStock, q + 1))}
                  disabled={quantity >= selectedStock}
                  className="w-11 h-11 text-lg flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 h-11 text-[11px] uppercase font-medium text-white hover:opacity-85 rounded-[2px]"
                style={{ backgroundColor: "var(--color-accent)", letterSpacing: "0.18em" }}
              >
                {`Add to Cart — ${currency} ${(product.price * quantity).toLocaleString()}`}
              </button>
            </div>
            {/* Row 2: buy now */}
            <button
              onClick={() => { handleAddToCart(); router.push("/checkout") }}
              className="w-full h-11 text-[11px] uppercase font-medium text-white/80 hover:bg-white/10 rounded-[2px]"
              style={{ border: "1px solid rgba(255,255,255,0.3)", letterSpacing: "0.18em" }}
            >
              Buy Now
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const CARE_INSTRUCTIONS = [
  {
    label: "Machine wash cold",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="M2 9h20" />
        <path strokeLinecap="round" d="M7 14.5c1-1.5 3-1.5 4 0s3 1.5 4 0" />
      </svg>
    ),
  },
  {
    label: "Do not bleach",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 18M9 3H5l7 9" />
        <path strokeLinecap="round" d="M19 21H5l7-9 3.5 4.5" />
      </svg>
    ),
  },
  {
    label: "Hang to dry",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v3m0 0c-3 0-6 2-6 5v6h12v-6c0-3-3-5-6-5z" />
      </svg>
    ),
  },
  {
    label: "Do not tumble dry",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <line x1="4" y1="4" x2="20" y2="20" strokeLinecap="round" />
      </svg>
    ),
  },
]

function MaterialCare({ variants }: { variants: Record<string, string[]> }) {
  const [open, setOpen] = useState(false)

  const materialKey = Object.keys(variants).find((k) => /^(material|materials|fabric)$/i.test(k))
  if (!materialKey) return null

  const material = variants[materialKey]?.join(", ")
  if (!material) return null

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full py-4 text-[11px] uppercase font-medium"
        style={{
          borderTop: "1px solid var(--divider-soft)",
          borderBottom: "1px solid var(--divider-soft)",
          color: "var(--color-primary)",
          letterSpacing: "0.15em",
        }}
        aria-expanded={open}
      >
        <span>Material &amp; Care</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div style={{ maxHeight: open ? "400px" : "0px", overflow: "hidden", transition: "max-height 0.35s ease" }}>
        <div className="pt-5 pb-2 space-y-5">
          <p className="text-base" style={{ color: "rgba(42,61,46,0.7)", lineHeight: 1.8 }}>{material}</p>
          <div className="grid grid-cols-2 gap-4">
            {CARE_INSTRUCTIONS.map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-3">
                <span style={{ color: "var(--color-accent)" }}>{icon}</span>
                <span className="text-xs" style={{ color: "rgba(42,61,46,0.6)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const DEFAULT_SIZE_GUIDE = [
  { size: "XS",  col2: "80–83",  col3: "60–63",  col4: "86–89"  },
  { size: "S",   col2: "84–87",  col3: "64–67",  col4: "90–93"  },
  { size: "M",   col2: "88–92",  col3: "68–72",  col4: "94–98"  },
  { size: "L",   col2: "93–98",  col3: "73–78",  col4: "99–104" },
  { size: "XL",  col2: "99–104", col3: "79–84",  col4: "105–110"},
  { size: "XXL", col2: "105–111",col3: "85–91",  col4: "111–117"},
]

const DEFAULT_HEADERS = ["Size", "Bust (cm)", "Waist (cm)", "Hips (cm)"]

function SizeGuide({ rawRows }: { rawRows?: string[] }) {
  const [open, setOpen] = useState(false)

  // Parse custom rows: "SIZE|COL2|COL3|COL4" or fall back to defaults
  const rows = rawRows && rawRows.length > 0
    ? rawRows.map((r) => { const [size, col2, col3, col4] = r.split("|"); return { size: size ?? "", col2: col2 ?? "", col3: col3 ?? "", col4: col4 ?? "" } })
    : DEFAULT_SIZE_GUIDE

  // Parse headers from first raw row if it starts with "HEADER:"
  let headers = DEFAULT_HEADERS
  if (rawRows && rawRows[0]?.startsWith("HEADER:")) {
    headers = rawRows[0].replace("HEADER:", "").split("|")
  }
  const dataRows = rawRows && rawRows[0]?.startsWith("HEADER:") ? rows.slice(1) : rows

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full py-4 text-[11px] uppercase font-medium"
        style={{
          borderTop: "1px solid var(--divider-soft)",
          borderBottom: "1px solid var(--divider-soft)",
          color: "var(--color-primary)",
          letterSpacing: "0.15em",
        }}
        aria-expanded={open}
      >
        <span>Size Chart</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div style={{ maxHeight: open ? "400px" : "0px", overflow: "hidden", transition: "max-height 0.35s ease" }}>
        <div className="overflow-x-auto pt-4">
          <table className="w-full text-sm border-collapse min-w-[340px]">
            <thead>
              <tr style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] uppercase font-medium"
                    style={{ letterSpacing: "0.15em" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "rgba(42,61,46,0.04)" : "rgba(42,61,46,0.08)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-primary)" }}>{row.size}</td>
                  <td className="px-4 py-3" style={{ color: "rgba(42,61,46,0.65)" }}>{row.col2}</td>
                  <td className="px-4 py-3" style={{ color: "rgba(42,61,46,0.65)" }}>{row.col3}</td>
                  <td className="px-4 py-3" style={{ color: "rgba(42,61,46,0.65)" }}>{row.col4 ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#000" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#000" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}
