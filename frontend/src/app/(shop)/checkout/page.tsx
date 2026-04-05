"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { storeConfig } from "@/config/store.config"
import { useCartStore } from "@/store/cartStore"
import { clientApi } from "@/lib/clientApi"
import type { OrderItem } from "@/types"

const { cities, fee: deliveryFee, freeAbove, currency } = storeConfig.delivery
const { brand, theme } = storeConfig

const schema = z.object({
  name: z.string().min(2, "Full name is required"),
  phone: z
    .string()
    .min(7, "Phone number is required")
    .regex(/^[0-9+\s()-]+$/, "Enter a valid phone number"),
  city: z.enum(cities as [string, ...string[]]),
  address: z.string().min(5, "Full address is required"),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface SuccessData {
  orderId: string
  phone: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const [success, setSuccess] = useState<SuccessData | null>(null)

  const sub = subtotal()
  const fee = sub >= freeAbove ? 0 : deliveryFee
  const total = sub + fee

  useEffect(() => {
    if (items.length === 0 && !success) router.replace("/shop")
  }, [items.length, router, success])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    const orderItems: OrderItem[] = items.map((i) => ({
      product_id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      variant: Object.keys(i.selectedVariants).length > 0 ? i.selectedVariants : undefined,
    }))

    const { data, error } = await clientApi.placeOrder({
      customer_info: { name: values.name, phone: values.phone },
      delivery_address: {
        city: values.city,
        address: values.address,
        notes: values.notes ?? "",
      },
      items: orderItems,
      subtotal: sub,
      delivery_fee: fee,
      total,
    })

    if (error || !data) {
      alert(error ?? "Something went wrong placing your order. Please try again.")
      return
    }

    // Show success modal before any redirect
    setSuccess({
      orderId: data.id,
      phone: values.phone,
      items: orderItems,
      subtotal: sub,
      deliveryFee: fee,
      total,
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-24 md:pb-12">
        <h1
          className="text-3xl md:text-4xl font-bold mb-6 md:mb-8"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          Checkout
        </h1>

        {/* Mobile compact summary */}
        <div
          className="md:hidden bg-gray-50 border px-4 py-3 mb-6 rounded"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div className="flex justify-between text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
            <span>{currency} {total.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Delivery: {fee === 0 ? "Free" : `${currency} ${fee.toLocaleString()}`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-10">
          {/* ── Form ── */}
          <form
            id="checkout-form"
            onSubmit={handleSubmit(onSubmit)}
            className="md:col-span-3 space-y-5"
            noValidate
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
            >
              Your Details
            </h2>

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

            <button
              type="submit"
              disabled={isSubmitting}
              className="hidden md:block w-full py-4 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--color-primary)", minHeight: "48px" }}
            >
              {isSubmitting ? "Placing Order…" : "Place Order (Cash on Delivery)"}
            </button>

            <p className="text-xs text-gray-400 text-center hidden md:block">
              No payment required now. We will call you to confirm your order.
            </p>
          </form>

          {/* ── Order summary sidebar (desktop) ── */}
          <aside className="hidden md:block md:col-span-2">
            <div className="border p-5 space-y-4 sticky top-20" style={{ borderColor: "#e5e7eb" }}>
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
              >
                Order Summary
              </h2>

              <ul className="space-y-3 text-sm">
                {items.map((item) => {
                  const variantLabel = Object.entries(item.selectedVariants)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")
                  return (
                    <li
                      key={`${item.product.id}-${JSON.stringify(item.selectedVariants)}`}
                      className="flex justify-between gap-2"
                    >
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: "var(--color-primary)" }}>
                          {item.product.name}
                          {item.quantity > 1 && (
                            <span className="text-gray-400 ml-1">×{item.quantity}</span>
                          )}
                        </p>
                        {variantLabel && (
                          <p className="text-xs text-gray-400">{variantLabel}</p>
                        )}
                      </div>
                      <span className="shrink-0" style={{ color: "var(--color-accent)" }}>
                        {currency} {(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <div className="border-t pt-3 space-y-2 text-sm" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{currency} {sub.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span style={{ color: fee === 0 ? "green" : undefined }}>
                    {fee === 0 ? "Free" : `${currency} ${fee.toLocaleString()}`}
                  </span>
                </div>
                <div
                  className="flex justify-between font-bold pt-2 border-t"
                  style={{ borderColor: "#e5e7eb", color: "var(--color-primary)" }}
                >
                  <span>Total</span>
                  <span>{currency} {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ── Mobile sticky submit ── */}
        <div
          className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t px-4 py-4 z-40"
          style={{ borderColor: "#e5e7eb" }}
        >
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting}
            className="w-full text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--color-primary)", height: "48px" }}
          >
            {isSubmitting ? "Placing Order…" : "Place Order (Cash on Delivery)"}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
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
  const shortId = data.orderId.slice(0, 8).toUpperCase()
  const waNumber = brand.whatsapp.replace(/[^0-9]/g, "")
  const waMessage = encodeURIComponent(
    `Hi! I just placed order #${shortId} on ${brand.name}`
  )
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`

  return (
    <div
      className="success-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
    >
      <div
        className="success-card bg-white w-full sm:max-w-md sm:rounded-2xl overflow-y-auto"
        style={{ maxHeight: "100dvh" }}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: theme.accentColor }} />

        <div className="px-6 pt-8 pb-6 space-y-6">
          {/* Animated checkmark */}
          <div className="flex flex-col items-center text-center space-y-4">
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

            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
              >
                Order Placed Successfully!
              </h2>
              <p className="text-sm text-gray-500">
                Thank you for shopping with{" "}
                <span className="font-semibold" style={{ color: "var(--color-primary)" }}>
                  {brand.name}
                </span>
              </p>
            </div>

            {/* Order ID pill */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono font-semibold"
              style={{ backgroundColor: `${theme.accentColor}18`, color: theme.accentColor }}
            >
              <span className="text-xs font-sans font-normal text-gray-500">Order</span>
              #{shortId}
            </div>

            <p className="text-sm text-gray-500 leading-relaxed">
              We will contact you on{" "}
              <span className="font-semibold" style={{ color: "var(--color-primary)" }}>
                {data.phone}
              </span>{" "}
              to confirm your order and arrange delivery.
            </p>
          </div>

          {/* Order summary */}
          <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
            <div
              className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
              style={{ backgroundColor: "#f9fafb", color: "var(--color-primary)" }}
            >
              Your Items
            </div>
            <ul className="divide-y" style={{ borderColor: "#f3f4f6" }}>
              {data.items.map((item, i) => (
                <li key={i} className="flex justify-between items-start px-4 py-3 text-sm gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: "var(--color-primary)" }}>
                      {item.name}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span style={{ color: theme.accentColor }} className="font-medium">
                      {currency} {(item.price * item.quantity).toLocaleString()}
                    </span>
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-400">×{item.quantity}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 py-3 space-y-1.5 border-t text-sm" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{currency} {data.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span>
                <span style={{ color: data.deliveryFee === 0 ? "#16a34a" : undefined }}>
                  {data.deliveryFee === 0 ? "Free" : `${currency} ${data.deliveryFee.toLocaleString()}`}
                </span>
              </div>
              <div
                className="flex justify-between font-bold text-base pt-2 border-t"
                style={{ borderColor: "#e5e7eb", color: "var(--color-primary)" }}
              >
                <span>Total</span>
                <span>{currency} {data.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp button */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#25D366" }}
          >
            <WhatsAppIcon />
            Chat with us on WhatsApp
          </a>

          {/* Continue shopping */}
          <button
            onClick={onContinue}
            className="w-full py-3.5 rounded-xl text-sm font-semibold uppercase tracking-widest transition-opacity hover:opacity-80 text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
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
  return [
    "w-full border px-3 text-base focus:outline-none transition-colors bg-white",
    hasError ? "border-red-400" : "border-gray-300 focus:border-[var(--color-accent)]",
  ].join(" ") + " min-h-[48px]"
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
    <div className="space-y-1">
      <label className="block text-sm font-medium" style={{ color: "var(--color-primary)" }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
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
