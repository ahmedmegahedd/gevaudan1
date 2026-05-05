"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAddedToCartStore } from "@/store/addedToCartStore"
import { useCartStore } from "@/store/cartStore"
import { storeConfig } from "@/config/store.config"

const AUTO_DISMISS_MS = 5500
const { currency } = storeConfig.delivery

export default function AddedToCartPopup() {
  const current = useAddedToCartStore((s) => s.current)
  const hide = useAddedToCartStore((s) => s.hide)
  const itemCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  )

  // Auto-dismiss; reset on each new add by re-running the effect
  useEffect(() => {
    if (!current) return
    const t = setTimeout(hide, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [current, hide])

  if (!current) return null

  const { product, variants, quantity } = current
  const variantLabel = Object.entries(variants)
    .filter(([k]) => !/^(material|materials|fabric|size_guide)$/i.test(k))
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ")
  const image = product.images?.[0]

  return (
    <div
      className="fixed z-[100] pointer-events-none px-4"
      style={{
        top: "calc(env(safe-area-inset-top) + 84px)",
        right: 0,
        left: 0,
      }}
    >
      <div
        key={current.key}
        className="cart-popup pointer-events-auto w-full sm:max-w-[380px] sm:ml-auto sm:mr-4 lg:mr-10"
      >
        <div
          className="rounded-card overflow-hidden"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 12px 40px rgba(61,20,25,0.18)",
          }}
        >
          {/* ── Header strip ── */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            <span
              className="inline-flex items-center gap-2 text-[10px] uppercase font-medium"
              style={{ letterSpacing: "0.22em" }}
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                style={{ color: "var(--color-cream)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Added to Bag
            </span>
            <button
              type="button"
              onClick={hide}
              aria-label="Dismiss"
              className="opacity-70 hover:opacity-100"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex items-stretch gap-4 p-5">
            <div
              className="relative w-16 sm:w-20 aspect-[3/4] shrink-0 overflow-hidden rounded-[2px]"
              style={{ backgroundColor: "var(--color-cream-deep)" }}
            >
              {image && (
                <Image
                  src={image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <p
                className="text-base leading-snug"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--color-primary)",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                }}
              >
                {product.name}
              </p>
              {variantLabel && (
                <p
                  className="text-[10px] uppercase mt-1.5"
                  style={{
                    color: "rgba(61,20,25,0.5)",
                    letterSpacing: "0.15em",
                  }}
                >
                  {variantLabel}
                </p>
              )}
              <div className="mt-auto pt-2 flex items-baseline gap-2">
                <p
                  className="price-text text-base"
                  style={{ color: "var(--color-accent)" }}
                >
                  {currency} {(product.price * quantity).toLocaleString()}
                </p>
                {quantity > 1 && (
                  <span
                    className="text-xs"
                    style={{ color: "rgba(61,20,25,0.5)" }}
                  >
                    × {quantity}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── CTAs ── */}
          <div
            className="grid grid-cols-2"
            style={{ borderTop: "1px solid var(--divider-soft)" }}
          >
            <button
              type="button"
              onClick={hide}
              className="text-[11px] uppercase font-medium py-3.5 hover:bg-[rgba(92,31,42,0.04)]"
              style={{
                color: "var(--color-primary)",
                letterSpacing: "0.2em",
              }}
            >
              Continue
            </button>
            <Link
              href="/cart"
              onClick={hide}
              className="text-[11px] uppercase font-medium py-3.5 text-center hover:opacity-90"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-cream)",
                letterSpacing: "0.2em",
              }}
            >
              View Bag {itemCount > 0 ? `(${itemCount})` : ""}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
