"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { storeConfig } from "@/config/store.config"
import { useCartStore } from "@/store/cartStore"
import type { Product } from "@/types"

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { currency } = storeConfig.delivery
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()

  const [mainImage, setMainImage] = useState(product.images[0] ?? null)
  const [quantity, setQuantity] = useState(1)

  // Build initial selected variants: first option for each key
  const variantKeys = Object.keys(product.variants)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const key of variantKeys) {
      initial[key] = product.variants[key][0] ?? ""
    }
    return initial
  })

  function handleAddToCart() {
    addItem(product, selectedVariants, quantity)
    router.push("/cart")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 pb-24 md:pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* ── Image Gallery ── */}
        <div className="space-y-3 md:space-y-4">
          {/* Main image — full width on mobile */}
          <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 w-full">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                No image
              </div>
            )}
          </div>

          {/* Thumbnails — horizontal scroll on mobile */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMainImage(img)}
                  className="relative shrink-0 w-16 md:w-20 aspect-square overflow-hidden border-2 transition-colors"
                  style={{
                    borderColor: mainImage === img ? "var(--color-accent)" : "transparent",
                  }}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className="space-y-5 md:space-y-6">
          {product.category && (
            <p className="text-xs uppercase tracking-widest text-gray-400">
              {product.category.name}
            </p>
          )}

          <h1
            className="text-2xl md:text-4xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            {product.name}
          </h1>

          <p
            className="text-xl md:text-2xl font-semibold"
            style={{ color: "var(--color-accent)" }}
          >
            {currency} {product.price.toLocaleString()}
          </p>

          {product.description && (
            <p className="text-gray-600 leading-relaxed text-base">{product.description}</p>
          )}

          {/* ── Dynamic variant selectors ── */}
          {variantKeys.map((key) => (
            <div key={key}>
              <p className="text-sm font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--color-primary)" }}>
                {key}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants[key].map((option) => {
                  const isSelected = selectedVariants[key] === option
                  return (
                    <button
                      key={option}
                      onClick={() =>
                        setSelectedVariants((prev) => ({ ...prev, [key]: option }))
                      }
                      className="min-h-[44px] min-w-[44px] px-4 py-3 text-sm border transition-colors"
                      style={{
                        borderColor: isSelected ? "var(--color-primary)" : "#d1d5db",
                        backgroundColor: isSelected ? "var(--color-primary)" : "transparent",
                        color: isSelected ? "#fff" : "var(--color-primary)",
                      }}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* ── Quantity ── */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--color-primary)" }}>
              Quantity
            </p>
            <div className="flex items-center gap-0 border w-fit"
              style={{ borderColor: "#d1d5db" }}>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-12 h-12 text-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-12 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-12 h-12 text-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* ── Add to Cart — Desktop only ── */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="hidden md:block w-full py-4 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>

          {product.stock > 0 && product.stock <= 5 && (
            <p className="text-sm text-red-500">
              Only {product.stock} left in stock
            </p>
          )}
        </div>
      </div>

      {/* ── Sticky Add to Cart bar — Mobile only ── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t px-4 py-3 flex items-center gap-3 z-40"
        style={{ borderColor: "#e5e7eb" }}>
        {/* Quantity controls */}
        <div className="flex items-center border shrink-0" style={{ borderColor: "#d1d5db" }}>
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-12 h-12 text-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-12 h-12 text-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="flex-1 h-12 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {product.stock === 0
            ? "Out of Stock"
            : `Add to Cart — ${currency} ${(product.price * quantity).toLocaleString()}`}
        </button>
      </div>
    </div>
  )
}
