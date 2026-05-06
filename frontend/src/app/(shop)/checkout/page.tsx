"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { storeConfig } from "@/config/store.config"
import { useCartStore } from "@/store/cartStore"
import { clientApi } from "@/lib/clientApi"
import { formatOrderNumber } from "@/lib/orderNumber"
import { formatVariantLabel } from "@/lib/colorNames"
import CheckoutRecommendations from "@/components/shop/CheckoutRecommendations"
import type { OrderItem } from "@/types"

const { cities, fee: deliveryFee, freeAbove, currency } = storeConfig.delivery
const { brand, theme } = storeConfig

const schema = z.object({
  name: z.string().min(2, "Full name is required"),
  phone: z
    .string()
    .min(7, "Phone number is required")
    .regex(/^[0-9+\s()-]+$/, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  city: z.enum(cities as [string, ...string[]]),
  address: z.string().min(5, "Full address is required"),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface PromoState {
  code: string
  discountAmount: number
  message: string
}

interface SuccessData {
  orderId: string
  orderNumber: number
  phone: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  discountAmount: number
  total: number
  promoCode: string | null
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [promo, setPromo] = useState<PromoState | null>(null)
  const [promoInput, setPromoInput] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState("")

  const sub = subtotal()
  const fee = sub >= freeAbove ? 0 : deliveryFee
  const discountAmount = promo?.discountAmount ?? 0
  const total = Math.max(0, sub + fee - discountAmount)

  useEffect(() => {
    if (items.length === 0 && !success) router.replace("/shop")
  }, [items.length, router, success])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    setPromoLoading(true)
    setPromoError("")
    setPromo(null)
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderTotal: sub + fee }),
      })
      const data = await res.json()
      if (data.valid) {
        setPromo({ code, discountAmount: data.discount_amount, message: data.message })
      } else {
        setPromoError(data.message ?? "Invalid promo code.")
      }
    } catch {
      setPromoError("Failed to validate code. Please try again.")
    } finally {
      setPromoLoading(false)
    }
  }

  function removePromo() {
    setPromo(null)
    setPromoInput("")
    setPromoError("")
  }

  async function onSubmit(values: FormValues) {
    const orderItems: OrderItem[] = items.map((i) => ({
      product_id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      variant: Object.keys(i.selectedVariants).length > 0 ? i.selectedVariants : undefined,
    }))

    const trimmedEmail = values.email?.trim() ?? ""

    const { data, error } = await clientApi.placeOrder({
      customer_info: {
        name: values.name,
        phone: values.phone,
        email: trimmedEmail || undefined,
      },
      delivery_address: {
        city: values.city,
        address: values.address,
        notes: values.notes ?? "",
      },
      items: orderItems,
      subtotal: sub,
      delivery_fee: fee,
      discount_amount: discountAmount,
      total,
      promo_code: promo?.code ?? null,
    })

    if (error || !data) {
      alert(error ?? "Something went wrong placing your order. Please try again.")
      return
    }

    setSuccess({
      orderId: data.id,
      orderNumber: data.order_number,
      phone: values.phone,
      items: orderItems,
      subtotal: sub,
      deliveryFee: fee,
      discountAmount,
      total,
      promoCode: promo?.code ?? null,
    })
  }

  if (items.length === 0 && !success) return null

  return (
    <>
      {/* ── Success modal overlay ── */}
      {success && (
        <OrderSuccessModal
          data={success}
          onContinue={() => {
            clearCart()
            router.push("/shop")
          }}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-24 pb-32 md:pb-24">
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
          Checkout
        </h1>

        {/* ── Complete Your Look (recommendations) ── */}
        <CheckoutRecommendations />

        {/* Mobile compact summary */}
        <div
          className="md:hidden px-5 py-4 mb-10 rounded-card card-shadow"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div
            className="flex justify-between text-base"
            style={{ color: "var(--color-primary)", fontWeight: 500 }}
          >
            <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
            <span className="price-text">{currency} {total.toLocaleString()}</span>
          </div>
          <p className="text-xs mt-2" style={{ color: "rgba(42,61,46,0.4)" }}>
            Delivery: {fee === 0 ? "Free" : `${currency} ${fee.toLocaleString()}`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-16">
          {/* ── Form ── */}
          <form
            id="checkout-form"
            onSubmit={handleSubmit(onSubmit)}
            className="md:col-span-3 space-y-10"
            noValidate
          >
            <h2
              className="text-[22px] md:text-[28px]"
              style={{
                color: "var(--color-primary)",
                fontFamily: "var(--font-heading)",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Your Details
            </h2>

            <div className="space-y-8">
              <Field label="Full Name" error={errors.name?.message}>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Jane Doe"
                  className={inputClass(!!errors.name)}
                />
              </Field>

              <Field label="Phone Number" error={errors.phone?.message}>
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="+20 100 123 4567"
                  className={inputClass(!!errors.phone)}
                />
              </Field>

              <Field
                label="Email (optional — for order confirmation)"
                error={errors.email?.message}
              >
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  className={inputClass(!!errors.email)}
                />
              </Field>

              <Field label="City" error={errors.city?.message}>
                <select {...register("city")} className={inputClass(!!errors.city)}>
                  <option value="">Select your city…</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </Field>

              <Field label="Full Address" error={errors.address?.message}>
                <textarea
                  {...register("address")}
                  rows={3}
                  placeholder="Street name, building number, floor, apartment…"
                  className={inputClass(!!errors.address)}
                />
              </Field>

              <Field label="Notes (optional)" error={undefined}>
                <textarea
                  {...register("notes")}
                  rows={2}
                  placeholder="Any special instructions for delivery…"
                  className={inputClass(false)}
                />
              </Field>

              {/* ── Promo Code ── */}
              <div>
                <p
                  className="block text-[11px] uppercase font-medium mb-3"
                  style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
                >
                  Promo Code
                </p>
                {promo ? (
                  <div
                    className="flex items-center justify-between px-4 py-4 rounded-card text-sm"
                    style={{
                      border: `1px solid ${theme.accentColor}`,
                      backgroundColor: `${theme.accentColor}12`,
                    }}
                  >
                    <span className="font-medium" style={{ color: theme.accentColor }}>
                      ✓ {promo.message}
                    </span>
                    <button
                      type="button"
                      onClick={removePromo}
                      className="text-xs uppercase ml-3 hover:text-red-500"
                      style={{
                        color: "rgba(42,61,46,0.5)",
                        letterSpacing: "0.15em",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3 items-end">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError("") }}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                      placeholder="Enter promo code"
                      className={inputClass(!!promoError)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={applyPromo}
                      disabled={promoLoading || !promoInput.trim()}
                      className="text-[11px] uppercase font-medium text-white shrink-0 hover:opacity-85 disabled:opacity-40 rounded-[2px]"
                      style={{
                        backgroundColor: theme.accentColor,
                        height: "52px",
                        padding: "0 24px",
                        letterSpacing: "0.18em",
                      }}
                    >
                      {promoLoading ? "…" : "Apply"}
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="mt-2 text-xs" style={{ color: "#dc2626" }}>{promoError}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="hidden md:flex items-center justify-center w-full text-[11px] uppercase font-medium text-white hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed rounded-[2px]"
              style={{
                backgroundColor: "var(--color-primary)",
                height: "60px",
                letterSpacing: "0.25em",
              }}
            >
              {isSubmitting ? "Placing Order…" : "Place Order (Cash on Delivery)"}
            </button>

            <p
              className="text-xs text-center hidden md:block"
              style={{ color: "rgba(42,61,46,0.4)", lineHeight: 1.7 }}
            >
              No payment required now. We will call you to confirm your order.
            </p>
          </form>

          {/* ── Order summary sidebar (desktop) ── */}
          <aside className="hidden md:block md:col-span-2">
            <div
              className="sticky top-24 p-8 space-y-6 card-shadow rounded-card"
              style={{ backgroundColor: "#ffffff" }}
            >
              <h2
                className="text-[22px]"
                style={{
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                }}
              >
                Order Summary
              </h2>

              <ul className="space-y-5 text-sm">
                {items.map((item) => {
                  const variantLabel = formatVariantLabel(item.product, item.selectedVariants, ", ")
                  return (
                    <li
                      key={`${item.product.id}-${JSON.stringify(item.selectedVariants)}`}
                      className="flex justify-between gap-3"
                    >
                      <div className="flex-1">
                        <p
                          style={{
                            color: "var(--color-primary)",
                            fontFamily: "var(--font-heading)",
                            fontWeight: 500,
                          }}
                        >
                          {item.product.name}
                          {item.quantity > 1 && (
                            <span className="ml-1" style={{ color: "rgba(42,61,46,0.4)" }}>
                              ×{item.quantity}
                            </span>
                          )}
                        </p>
                        {variantLabel && (
                          <p className="text-xs mt-1" style={{ color: "rgba(42,61,46,0.4)" }}>
                            {variantLabel}
                          </p>
                        )}
                      </div>
                      <span
                        className="price-text shrink-0"
                        style={{ color: "var(--color-accent)" }}
                      >
                        {currency} {(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <div
                className="pt-5 space-y-3 text-sm"
                style={{ borderTop: "1px solid var(--divider-soft)" }}
              >
                <div className="flex justify-between" style={{ color: "rgba(42,61,46,0.6)" }}>
                  <span>Subtotal</span>
                  <span>{currency} {sub.toLocaleString()}</span>
                </div>
                <div className="flex justify-between" style={{ color: "rgba(42,61,46,0.6)" }}>
                  <span>Delivery</span>
                  <span style={{ color: fee === 0 ? "#16a34a" : undefined }}>
                    {fee === 0 ? "Free" : `${currency} ${fee.toLocaleString()}`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between" style={{ color: theme.accentColor }}>
                    <span>Discount {promo?.code && `(${promo.code})`}</span>
                    <span>− {currency} {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div
                  className="flex justify-between text-lg pt-3"
                  style={{
                    borderTop: "1px solid var(--divider-soft)",
                    color: "var(--color-primary)",
                    fontWeight: 500,
                  }}
                >
                  <span>Total</span>
                  <span className="price-text">{currency} {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ── Mobile sticky submit ── */}
        <div
          className="fixed bottom-0 left-0 right-0 md:hidden px-4 py-4 z-40"
          style={{
            backgroundColor: "var(--color-primary)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting}
            className="w-full text-[11px] uppercase font-medium text-white hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed rounded-[2px]"
            style={{
              backgroundColor: "var(--color-accent)",
              height: "52px",
              letterSpacing: "0.22em",
            }}
          >
            {isSubmitting ? "Placing Order…" : "Place Order (Cash on Delivery)"}
          </button>
          <p
            className="text-xs text-center mt-2"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            No payment required now.
          </p>
        </div>
      </div>
    </>
  )
}

// ── Success Modal ────────────────────────────────────────────

function OrderSuccessModal({
  data,
  onContinue,
}: {
  data: SuccessData
  onContinue: () => void
}) {
  const shortId = formatOrderNumber(data.orderNumber)
  const waNumber = brand.whatsapp.replace(/[^0-9]/g, "")
  const waMessage = encodeURIComponent(
    `Hi! I just placed order ${shortId} on ${brand.name}`
  )
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`

  return (
    <div
      className="success-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
    >
      <div
        className="success-card bg-[#EFE6D6] w-full sm:max-w-md sm:rounded-card overflow-y-auto"
        style={{ maxHeight: "100dvh" }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ backgroundColor: theme.accentColor }} />

        <div className="px-6 pt-10 pb-8 space-y-8">
          {/* Animated checkmark */}
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="success-check-wrap">
              <svg
                width="72"
                height="72"
                viewBox="0 0 52 52"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="success-circle"
                  cx="26"
                  cy="26"
                  r="25"
                  stroke={theme.accentColor}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  className="success-check"
                  d="M14 27l8 8 16-18"
                  stroke={theme.accentColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h2
                className="text-[28px]"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--color-primary)",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                }}
              >
                Order Placed Successfully!
              </h2>
              <p className="text-sm" style={{ color: "rgba(42,61,46,0.5)", lineHeight: 1.7 }}>
                Thank you for shopping with{" "}
                <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                  {brand.name}
                </span>
              </p>
            </div>

            {/* Order ID pill */}
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-mono"
              style={{ backgroundColor: `${theme.accentColor}18`, color: theme.accentColor, fontWeight: 500 }}
            >
              <span className="text-xs font-sans" style={{ color: "rgba(42,61,46,0.5)", fontWeight: 400 }}>
                Order
              </span>
              #{shortId}
            </div>

            <p className="text-sm" style={{ color: "rgba(42,61,46,0.55)", lineHeight: 1.8 }}>
              We will contact you on{" "}
              <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                {data.phone}
              </span>{" "}
              to confirm your order and arrange delivery.
            </p>
          </div>

          {/* Order summary */}
          <div className="rounded-card overflow-hidden" style={{ border: "1px solid var(--divider-soft)" }}>
            <div
              className="px-5 py-3 text-[10px] uppercase font-medium"
              style={{
                backgroundColor: "rgba(42,61,46,0.04)",
                color: "var(--color-primary)",
                letterSpacing: "0.18em",
              }}
            >
              Your Items
            </div>
            <ul>
              {data.items.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between items-start px-5 py-4 text-sm gap-3"
                  style={i > 0 ? { borderTop: "1px solid var(--divider-soft)" } : undefined}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate"
                      style={{
                        color: "var(--color-primary)",
                        fontFamily: "var(--font-heading)",
                        fontWeight: 500,
                      }}
                    >
                      {item.name}
                    </p>
                    {item.variant && (
                      <p className="text-xs mt-1" style={{ color: "rgba(42,61,46,0.4)" }}>
                        {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="price-text" style={{ color: theme.accentColor }}>
                      {currency} {(item.price * item.quantity).toLocaleString()}
                    </span>
                    {item.quantity > 1 && (
                      <p className="text-xs" style={{ color: "rgba(42,61,46,0.4)" }}>×{item.quantity}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div
              className="px-5 py-4 space-y-2 text-sm"
              style={{ borderTop: "1px solid var(--divider-soft)" }}
            >
              <div className="flex justify-between" style={{ color: "rgba(42,61,46,0.5)" }}>
                <span>Subtotal</span>
                <span>{currency} {data.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between" style={{ color: "rgba(42,61,46,0.5)" }}>
                <span>Delivery</span>
                <span style={{ color: data.deliveryFee === 0 ? "#16a34a" : undefined }}>
                  {data.deliveryFee === 0 ? "Free" : `${currency} ${data.deliveryFee.toLocaleString()}`}
                </span>
              </div>
              <div
                className="flex justify-between text-base pt-3"
                style={{
                  borderTop: "1px solid var(--divider-soft)",
                  color: "var(--color-primary)",
                  fontWeight: 500,
                }}
              >
                <span>Total</span>
                <span className="price-text">{currency} {data.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp button */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-3 text-[11px] uppercase font-medium text-white hover:opacity-90 rounded-[2px]"
            style={{
              backgroundColor: "#25D366",
              height: "52px",
              letterSpacing: "0.18em",
            }}
          >
            <WhatsAppIcon />
            Chat with us on WhatsApp
          </a>

          {/* Continue shopping */}
          <button
            onClick={onContinue}
            className="w-full text-[11px] uppercase font-medium text-white hover:opacity-85 rounded-[2px]"
            style={{
              backgroundColor: "var(--color-primary)",
              height: "52px",
              letterSpacing: "0.25em",
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function inputClass(hasError: boolean) {
  return ["input-underline", hasError ? "has-error" : ""].join(" ")
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label
        className="block text-[11px] uppercase font-medium"
        style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
      >
        {label}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: "#dc2626" }}>{error}</p>}
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
