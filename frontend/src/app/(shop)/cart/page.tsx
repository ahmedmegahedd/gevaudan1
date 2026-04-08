"use client"

import Link from "next/link"
import Image from "next/image"
import { storeConfig } from "@/config/store.config"
import { useCartStore } from "@/store/cartStore"
import { useToastStore } from "@/store/toastStore"
import { getRealVariantKeys, getVariantStock } from "@/lib/variantStock"

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, deliveryFee, total } =
    useCartStore()
  const { currency, freeAbove } = storeConfig.delivery

  const sub = subtotal()
  const fee = deliveryFee()
  const orderTotal = total()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          Your Cart
        </h1>
        <p className="text-gray-500 mb-8">Your cart is empty.</p>
        <Link
          href="/shop"
          className="inline-block px-8 py-3 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-48 lg:pb-12">
      <h1
        className="text-3xl md:text-4xl font-bold mb-6 md:mb-10"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
      >
        Your Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        {/* ── Cart Items ── */}
        <div className="lg:col-span-2 space-y-5 md:space-y-6">
          {items.map((item) => {
            const variantLabel = Object.entries(item.selectedVariants)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")

            return (
              <div
                key={`${item.product.id}-${JSON.stringify(item.selectedVariants)}`}
                className="flex gap-3 sm:gap-4 pb-5 md:pb-6 border-b"
                style={{ borderColor: "#e5e7eb" }}
              >
                {/* Image — smaller on mobile */}
                <div className="relative w-20 sm:w-24 aspect-[3/4] shrink-0 overflow-hidden" style={{ backgroundColor: "#a8c8e0" }}>
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
                      No image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <h2
                    className="font-semibold text-base leading-tight"
                    style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
                  >
                    {item.product.name}
                  </h2>
                  {variantLabel && (
                    <p className="text-xs text-gray-500">{variantLabel}</p>
                  )}
                  <p className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
                    {currency} {item.product.price.toLocaleString()}
                  </p>

                  {(() => {
                    const rk = getRealVariantKeys(item.product.variants)
                    const s = getVariantStock(item.product.stock, item.product.variant_stock, item.selectedVariants, rk)
                    return item.quantity >= s && s > 0 ? (
                      <p className="text-xs text-red-500">Max stock reached ({s})</p>
                    ) : null
                  })()}

                  <div className="flex items-center gap-3 mt-2">
                    {/* Quantity controls — min 40px touch targets */}
                    <div className="flex items-center border" style={{ borderColor: "#d1d5db" }}>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.selectedVariants, item.quantity - 1)
                        }
                        className="w-10 h-10 flex items-center justify-center hover:bg-[#a8c8e0] transition-colors text-sm"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.selectedVariants, item.quantity + 1)
                        }
                        disabled={(() => {
                          const rk = getRealVariantKeys(item.product.variants)
                          const s = getVariantStock(item.product.stock, item.product.variant_stock, item.selectedVariants, rk)
                          return item.quantity >= s
                        })()}
                        className="w-10 h-10 flex items-center justify-center hover:bg-[#a8c8e0] transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        removeItem(item.product.id, item.selectedVariants)
                        useToastStore.getState().addToast("Item removed from cart", "info")
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Item subtotal */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                    {currency} {(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Continue Shopping ── */}
        <div className="lg:col-span-2">
          <Link
            href="/shop"
            className="group inline-flex w-full lg:w-auto items-center justify-center gap-2 px-6 py-3 text-sm uppercase tracking-widest font-semibold border transition-colors"
            style={{
              borderColor: storeConfig.theme.accentColor,
              color: storeConfig.theme.accentColor,
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.backgroundColor = storeConfig.theme.accentColor
              el.style.color = "#fff"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.backgroundColor = "transparent"
              el.style.color = storeConfig.theme.accentColor
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Continue Shopping
          </Link>
        </div>

        {/* ── Order Summary — Desktop sidebar (hidden on mobile) ── */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="border p-6 space-y-4 sticky top-20" style={{ borderColor: "#e5e7eb" }}>
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
            >
              Order Summary
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span style={{ color: "var(--color-primary)" }}>
                  {currency} {sub.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span style={{ color: fee === 0 ? "green" : "var(--color-primary)" }}>
                  {fee === 0 ? "Free" : `${currency} ${fee.toLocaleString()}`}
                </span>
              </div>

              {fee > 0 && (
                <p className="text-xs text-gray-400">
                  Free delivery on orders above {currency} {freeAbove.toLocaleString()}
                </p>
              )}
            </div>

            <div
              className="flex justify-between font-bold text-base pt-4 border-t"
              style={{ borderColor: "#e5e7eb", color: "var(--color-primary)" }}
            >
              <span>Total</span>
              <span>
                {currency} {orderTotal.toLocaleString()}
              </span>
            </div>

            <Link
              href="/checkout"
              className="block w-full py-4 text-center text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Proceed to Order
            </Link>

            <Link
              href="/shop"
              className="block text-center text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky order summary bar ── */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden border-t px-4 py-4 space-y-2 z-40"
        style={{ backgroundColor: "var(--color-primary)", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="flex justify-between text-sm text-white/70">
          <span>Delivery</span>
          <span style={{ color: fee === 0 ? "#6ee7b7" : "rgba(255,255,255,0.7)" }}>
            {fee === 0 ? "Free" : `${currency} ${fee.toLocaleString()}`}
          </span>
        </div>
        <div className="flex justify-between font-bold text-white">
          <span>Total</span>
          <span>{currency} {orderTotal.toLocaleString()}</span>
        </div>
        <Link
          href="/checkout"
          className="block w-full py-4 text-center text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          Proceed to Order
        </Link>
      </div>
    </div>
  )
}
