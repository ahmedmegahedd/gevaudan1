"use client"

import Link from "next/link"
import Image from "next/image"
import { storeConfig } from "@/config/store.config"
import { useCartStore } from "@/store/cartStore"
import { useToastStore } from "@/store/toastStore"
import { getRealVariantKeys, getVariantStock } from "@/lib/variantStock"
import { formatVariantLabel } from "@/lib/colorNames"

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, deliveryFee, total } =
    useCartStore()
  const { currency, freeAbove } = storeConfig.delivery

  const sub = subtotal()
  const fee = deliveryFee()
  const orderTotal = total()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-24 md:py-32 text-center">
        <h1
          className="text-[36px] md:text-[56px] mb-6"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-primary)",
            fontWeight: 500,
            letterSpacing: "0.02em",
            lineHeight: 1.1,
          }}
        >
          Your Cart
        </h1>
        <p
          className="text-base mb-12"
          style={{ color: "rgba(61,20,25,0.5)", lineHeight: 1.8 }}
        >
          Your cart is empty.
        </p>
        <Link href="/shop" className="luxe-primary-btn">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-24 pb-48 lg:pb-24">
      <h1
        className="text-[36px] md:text-[56px] mb-12 md:mb-16"
        style={{
          fontFamily: "var(--font-heading)",
          color: "var(--color-primary)",
          fontWeight: 500,
          letterSpacing: "0.02em",
          lineHeight: 1.1,
        }}
      >
        Your Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
        {/* ── Cart Items ── */}
        <div className="lg:col-span-2 space-y-8 md:space-y-10">
          {items.map((item) => {
            const variantLabel = formatVariantLabel(item.product, item.selectedVariants, ", ")

            return (
              <div
                key={`${item.product.id}-${JSON.stringify(item.selectedVariants)}`}
                className="flex gap-5 sm:gap-6 pb-8 md:pb-10"
                style={{ borderBottom: "1px solid var(--divider-soft)" }}
              >
                {/* Image */}
                <div
                  className="relative w-24 sm:w-28 aspect-[3/4] shrink-0 overflow-hidden rounded-card"
                  style={{ backgroundColor: "#E0D5C2" }}
                >
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
                      No image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <h2
                    className="text-lg md:text-xl"
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: "var(--color-primary)",
                      fontWeight: 500,
                      letterSpacing: "0.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.product.name}
                  </h2>
                  {variantLabel && (
                    <p
                      className="text-xs uppercase"
                      style={{ color: "rgba(61,20,25,0.5)", letterSpacing: "0.1em" }}
                    >
                      {variantLabel}
                    </p>
                  )}
                  <p
                    className="price-text text-base"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {currency} {item.product.price.toLocaleString()}
                  </p>

                  {(() => {
                    const rk = getRealVariantKeys(item.product.variants)
                    const s = getVariantStock(item.product.stock, item.product.variant_stock, item.selectedVariants, rk)
                    return item.quantity >= s && s > 0 ? (
                      <p className="text-xs" style={{ color: "#dc2626" }}>Max stock reached ({s})</p>
                    ) : null
                  })()}

                  <div className="flex items-center gap-5 mt-4">
                    {/* Quantity controls */}
                    <div
                      className="flex items-center rounded-[2px]"
                      style={{ border: "1px solid rgba(61,20,25,0.15)" }}
                    >
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.selectedVariants, item.quantity - 1)
                        }
                        className="w-10 h-10 flex items-center justify-center hover:bg-[#E0D5C2] text-base"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.selectedVariants, item.quantity + 1)
                        }
                        disabled={(() => {
                          const rk = getRealVariantKeys(item.product.variants)
                          const s = getVariantStock(item.product.stock, item.product.variant_stock, item.selectedVariants, rk)
                          return item.quantity >= s
                        })()}
                        className="w-10 h-10 flex items-center justify-center hover:bg-[#E0D5C2] text-base disabled:opacity-30 disabled:cursor-not-allowed"
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
                      className="text-[10px] uppercase font-medium hover:text-red-500"
                      style={{
                        color: "rgba(61,20,25,0.4)",
                        letterSpacing: "0.18em",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Item subtotal */}
                <div className="text-right shrink-0">
                  <p
                    className="price-text text-base"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {currency} {(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Order Summary — Desktop sidebar ── */}
        <div className="hidden lg:block lg:col-span-1">
          <div
            className="sticky top-24 p-8 space-y-6 card-shadow rounded-card"
            style={{ backgroundColor: "#ffffff" }}
          >
            <h2
              className="text-[22px]"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-primary)",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "rgba(61,20,25,0.6)" }}>Subtotal</span>
                <span style={{ color: "var(--color-primary)" }}>
                  {currency} {sub.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span style={{ color: "rgba(61,20,25,0.6)" }}>Delivery</span>
                <span style={{ color: fee === 0 ? "#16a34a" : "var(--color-primary)" }}>
                  {fee === 0 ? "Free" : `${currency} ${fee.toLocaleString()}`}
                </span>
              </div>

              {fee > 0 && (
                <p className="text-xs" style={{ color: "rgba(61,20,25,0.4)", lineHeight: 1.7 }}>
                  Free delivery on orders above {currency} {freeAbove.toLocaleString()}
                </p>
              )}
            </div>

            <div
              className="flex justify-between text-lg pt-5"
              style={{
                borderTop: "1px solid var(--divider-soft)",
                color: "var(--color-primary)",
              }}
            >
              <span style={{ fontWeight: 500 }}>Total</span>
              <span className="price-text" style={{ fontWeight: 500 }}>
                {currency} {orderTotal.toLocaleString()}
              </span>
            </div>

            <Link
              href="/checkout"
              className="flex items-center justify-center w-full text-[11px] uppercase font-medium text-white hover:opacity-85 rounded-[2px]"
              style={{
                backgroundColor: "var(--color-primary)",
                height: "52px",
                letterSpacing: "0.25em",
              }}
            >
              Proceed to Order
            </Link>

            <Link
              href="/shop"
              className="block text-center text-[11px] uppercase font-medium hover:opacity-100"
              style={{
                color: "rgba(61,20,25,0.5)",
                letterSpacing: "0.18em",
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* ── Continue Shopping (mobile/tablet) ── */}
        <div className="lg:hidden">
          <Link
            href="/shop"
            className="luxe-outline-btn w-full"
            style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>

      {/* ── Mobile sticky order summary bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 lg:hidden px-4 py-4 space-y-2 z-40"
        style={{
          backgroundColor: "var(--color-primary)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div className="flex justify-between text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
          <span>Delivery</span>
          <span style={{ color: fee === 0 ? "#6ee7b7" : "rgba(255,255,255,0.7)" }}>
            {fee === 0 ? "Free" : `${currency} ${fee.toLocaleString()}`}
          </span>
        </div>
        <div className="flex justify-between text-base text-white" style={{ fontWeight: 500 }}>
          <span>Total</span>
          <span className="price-text">{currency} {orderTotal.toLocaleString()}</span>
        </div>
        <Link
          href="/checkout"
          className="flex items-center justify-center w-full text-[11px] uppercase font-medium text-white hover:opacity-85 rounded-[2px]"
          style={{
            backgroundColor: "var(--color-accent)",
            height: "52px",
            letterSpacing: "0.25em",
          }}
        >
          Proceed to Order
        </Link>
      </div>
    </div>
  )
}
