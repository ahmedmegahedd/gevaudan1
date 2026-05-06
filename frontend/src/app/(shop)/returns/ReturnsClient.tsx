"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { storeConfig } from "@/config/store.config"
import { formatOrderNumber } from "@/lib/orderNumber"
import type { Order, OrderItem, ReturnRequestType } from "@/types"

const { currency } = storeConfig.delivery
const RETURN_WINDOW_DAYS = 14

type Step = 1 | 2 | 3 | 4 | 5 // 5 = success

interface ExchangeProduct {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
}

interface ReturnsClientProps {
  /** All in-stock products available for exchange selection. */
  exchangeProducts: ExchangeProduct[]
}

type LookupResult = {
  order: Order
  productImages: Record<string, string | null>
}

export default function ReturnsClient({ exchangeProducts }: ReturnsClientProps) {
  const [step, setStep] = useState<Step>(1)

  // Step 1 state
  const [orderIdInput, setOrderIdInput] = useState("")
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState("")

  // Loaded order
  const [lookup, setLookup] = useState<LookupResult | null>(null)

  // Step 2 state
  const [selectedItemKeys, setSelectedItemKeys] = useState<Set<string>>(new Set())
  const [requestType, setRequestType] = useState<ReturnRequestType>("refund")
  const [reason, setReason] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [step2Error, setStep2Error] = useState("")

  // Step 3 state
  const [exchangeProductId, setExchangeProductId] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState("")

  // Step 4 state
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null)

  // ── Lookup ──────────────────────────────────────────────
  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!orderIdInput.trim()) return
    setLookupLoading(true)
    setLookupError("")

    try {
      const res = await fetch("/api/returns/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderIdInput.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setLookupError(json.error ?? "Could not look up that order.")
        setLookupLoading(false)
        return
      }

      const result = json as LookupResult
      setLookup(result)
      // Pre-fill customer info from the order
      setCustomerName(result.order.customer_info.name)
      setCustomerPhone(result.order.customer_info.phone)
      setStep(2)
    } catch {
      setLookupError("Network error. Please try again.")
    } finally {
      setLookupLoading(false)
    }
  }

  // ── Step 2 helpers ──────────────────────────────────────
  function itemKey(item: OrderItem, index: number): string {
    return `${index}-${item.product_id}-${JSON.stringify(item.variant ?? {})}`
  }

  const selectedItems = useMemo(() => {
    if (!lookup) return [] as OrderItem[]
    return lookup.order.items.filter((item, i) => selectedItemKeys.has(itemKey(item, i)))
  }, [lookup, selectedItemKeys])

  function toggleItem(key: string) {
    setSelectedItemKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleStep2Continue() {
    setStep2Error("")
    if (selectedItems.length === 0) {
      setStep2Error("Please select at least one item to return or exchange.")
      return
    }
    if (reason.trim().length < 20) {
      setStep2Error("Please describe your reason in at least 20 characters.")
      return
    }
    if (customerName.trim().length < 2) {
      setStep2Error("Please enter your name.")
      return
    }
    if (customerPhone.trim().length < 7) {
      setStep2Error("Please enter a valid phone number.")
      return
    }
    if (requestType === "exchange") {
      setStep(3)
    } else {
      setStep(4)
    }
  }

  // ── Step 3 helpers ──────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return exchangeProducts
    return exchangeProducts.filter((p) => p.name.toLowerCase().includes(q))
  }, [exchangeProducts, productSearch])

  const selectedExchangeProduct = useMemo(
    () => exchangeProducts.find((p) => p.id === exchangeProductId) ?? null,
    [exchangeProducts, exchangeProductId]
  )

  // ── Submit ──────────────────────────────────────────────
  async function handleSubmit() {
    if (!lookup) return
    setSubmitLoading(true)
    setSubmitError("")

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: lookup.order.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          request_type: requestType,
          reason: reason.trim(),
          items: selectedItems,
          exchange_product_id:
            requestType === "exchange" ? exchangeProductId : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setSubmitError(json.error ?? "Something went wrong. Please try again.")
        setSubmitLoading(false)
        return
      }
      setSubmittedRequestId(json.id ?? null)
      setStep(5)
    } catch {
      setSubmitError("Network error. Please try again.")
    } finally {
      setSubmitLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-24">
      {/* Header */}
      <div className="text-center mb-12 md:mb-16">
        <p
          className="text-[11px] uppercase mb-6"
          style={{ color: "var(--color-accent)", letterSpacing: "0.3em" }}
        >
          Customer Care
        </p>
        <h1
          className="text-[36px] md:text-[56px] mb-4"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-primary)",
            fontWeight: 500,
            letterSpacing: "0.02em",
            lineHeight: 1.1,
          }}
        >
          Returns &amp; Exchange
        </h1>
        <p
          className="text-base md:text-lg max-w-xl mx-auto"
          style={{ color: "rgba(42,61,46,0.55)", lineHeight: 1.8 }}
        >
          Within {RETURN_WINDOW_DAYS} days of your order, we&rsquo;re happy to
          exchange or refund. Start by entering your order ID.
        </p>
      </div>

      {/* Step indicator */}
      {step !== 5 && (
        <ol
          className="flex items-center justify-center gap-3 sm:gap-6 mb-12 flex-wrap"
          aria-label="Returns flow progress"
        >
          {[
            { n: 1, label: "Find Order" },
            { n: 2, label: "Select Items" },
            { n: 3, label: "Pick Exchange", hidden: requestType !== "exchange" },
            { n: 4, label: "Review" },
          ]
            .filter((s) => !s.hidden)
            .map((s) => {
              const active = step === s.n
              const done = step > s.n
              return (
                <li key={s.n} className="flex items-center gap-2">
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-full text-[11px]"
                    style={{
                      backgroundColor: active || done ? "var(--color-accent)" : "transparent",
                      color: active || done ? "#fff" : "rgba(42,61,46,0.5)",
                      border: active || done ? "1px solid var(--color-accent)" : "1px solid var(--divider-soft)",
                      fontWeight: 500,
                    }}
                  >
                    {done ? "✓" : s.n}
                  </span>
                  <span
                    className="text-[10px] sm:text-[11px] uppercase"
                    style={{
                      color: active ? "var(--color-primary)" : "rgba(42,61,46,0.5)",
                      letterSpacing: "0.18em",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {s.label}
                  </span>
                </li>
              )
            })}
        </ol>
      )}

      {/* ── Step 1: Order lookup ── */}
      {step === 1 && (
        <form
          onSubmit={handleLookup}
          className="rounded-card card-shadow p-8 md:p-10 space-y-6"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div>
            <h2
              className="text-[22px] md:text-[28px] mb-2"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-primary)",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Find Your Order
            </h2>
            <p className="text-sm" style={{ color: "rgba(42,61,46,0.6)", lineHeight: 1.7 }}>
              You&rsquo;ll find your order ID in your confirmation email or on
              the order confirmation page after checkout.
            </p>
          </div>

          <div className="space-y-2">
            <label
              className="block text-[11px] uppercase font-medium"
              style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
            >
              Order ID
            </label>
            <input
              type="text"
              value={orderIdInput}
              onChange={(e) => {
                setOrderIdInput(e.target.value)
                if (lookupError) setLookupError("")
              }}
              placeholder="e.g. G00012"
              className="input-underline"
              autoFocus
            />
          </div>

          {lookupError && (
            <p className="text-sm" style={{ color: "#dc2626", lineHeight: 1.7 }}>
              {lookupError}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/shop"
              className="text-[11px] uppercase font-medium self-center"
              style={{
                color: "rgba(42,61,46,0.5)",
                letterSpacing: "0.18em",
              }}
            >
              ← Back to shop
            </Link>
            <button
              type="submit"
              disabled={lookupLoading || !orderIdInput.trim()}
              className="ml-auto text-[11px] uppercase font-medium text-white hover:opacity-85 disabled:opacity-50 rounded-[2px]"
              style={{
                backgroundColor: "var(--color-primary)",
                height: "52px",
                padding: "0 36px",
                letterSpacing: "0.25em",
              }}
            >
              {lookupLoading ? "Looking up…" : "Look Up Order"}
            </button>
          </div>
        </form>
      )}

      {/* ── Step 2: Select items + type + reason + customer ── */}
      {step === 2 && lookup && (
        <Step2
          lookup={lookup}
          itemKey={itemKey}
          selectedItemKeys={selectedItemKeys}
          toggleItem={toggleItem}
          requestType={requestType}
          setRequestType={setRequestType}
          reason={reason}
          setReason={setReason}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          step2Error={step2Error}
          onBack={() => setStep(1)}
          onContinue={handleStep2Continue}
        />
      )}

      {/* ── Step 3: Pick exchange product ── */}
      {step === 3 && (
        <Step3
          products={filteredProducts}
          allCount={exchangeProducts.length}
          search={productSearch}
          setSearch={setProductSearch}
          selectedId={exchangeProductId}
          setSelectedId={setExchangeProductId}
          selectedProduct={selectedExchangeProduct}
          onBack={() => setStep(2)}
          onContinue={() => exchangeProductId && setStep(4)}
        />
      )}

      {/* ── Step 4: Review + submit ── */}
      {step === 4 && lookup && (
        <Step4
          order={lookup.order}
          productImages={lookup.productImages}
          selectedItems={selectedItems}
          requestType={requestType}
          reason={reason}
          customerName={customerName}
          customerPhone={customerPhone}
          exchangeProduct={selectedExchangeProduct}
          submitLoading={submitLoading}
          submitError={submitError}
          onBack={() => setStep(requestType === "exchange" ? 3 : 2)}
          onSubmit={handleSubmit}
        />
      )}

      {/* ── Step 5: Success ── */}
      {step === 5 && (
        <Step5
          requestId={submittedRequestId}
          phone={customerPhone}
        />
      )}
    </div>
  )
}

// ─── Step 2 ─────────────────────────────────────────────────────────────────

interface Step2Props {
  lookup: LookupResult
  itemKey: (item: OrderItem, i: number) => string
  selectedItemKeys: Set<string>
  toggleItem: (key: string) => void
  requestType: ReturnRequestType
  setRequestType: (t: ReturnRequestType) => void
  reason: string
  setReason: (s: string) => void
  customerName: string
  setCustomerName: (s: string) => void
  customerPhone: string
  setCustomerPhone: (s: string) => void
  step2Error: string
  onBack: () => void
  onContinue: () => void
}

function Step2({
  lookup,
  itemKey,
  selectedItemKeys,
  toggleItem,
  requestType,
  setRequestType,
  reason,
  setReason,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  step2Error,
  onBack,
  onContinue,
}: Step2Props) {
  const order = lookup.order
  const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  const shortId = formatOrderNumber(order.order_number)

  return (
    <div className="space-y-8">
      {/* Order header */}
      <div
        className="rounded-card card-shadow p-6 md:p-8"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2
            className="text-[20px] md:text-[24px]"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-primary)",
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            Order {shortId}
          </h2>
          <p
            className="text-[10px] uppercase"
            style={{ color: "rgba(42,61,46,0.5)", letterSpacing: "0.18em" }}
          >
            Placed {orderDate}
          </p>
        </div>
      </div>

      {/* Items list */}
      <div
        className="rounded-card card-shadow p-6 md:p-8 space-y-6"
        style={{ backgroundColor: "#ffffff" }}
      >
        <h3
          className="text-[11px] uppercase font-medium"
          style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
        >
          Select Items to Return or Exchange
        </h3>

        <ul className="space-y-5">
          {order.items.map((item, i) => {
            const key = itemKey(item, i)
            const checked = selectedItemKeys.has(key)
            const image = lookup.productImages[item.product_id]
            const variantLabel = item.variant
              ? Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(" · ")
              : null
            return (
              <li key={key}>
                <label
                  className="flex items-start gap-4 cursor-pointer"
                  style={{
                    border: checked
                      ? "1px solid var(--color-accent)"
                      : "1px solid var(--divider-soft)",
                    borderRadius: 4,
                    padding: 12,
                    backgroundColor: checked ? "rgba(68,119,148,0.06)" : "transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleItem(key)}
                    aria-label={`Select ${item.name}`}
                    style={{
                      marginTop: 4,
                      width: 18,
                      height: 18,
                      accentColor: "var(--color-accent)",
                      cursor: "pointer",
                    }}
                  />
                  <div
                    className="relative w-16 sm:w-20 aspect-[3/4] shrink-0 overflow-hidden rounded-[2px]"
                    style={{ backgroundColor: "#DCD2BD" }}
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-base"
                      style={{
                        color: "var(--color-primary)",
                        fontFamily: "var(--font-heading)",
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      {item.name}
                    </p>
                    {variantLabel && (
                      <p
                        className="text-xs mt-1"
                        style={{ color: "rgba(42,61,46,0.5)", letterSpacing: "0.05em" }}
                      >
                        {variantLabel}
                      </p>
                    )}
                    <div className="flex items-baseline gap-3 mt-2">
                      <span
                        className="text-[11px] uppercase"
                        style={{ color: "rgba(42,61,46,0.5)", letterSpacing: "0.15em" }}
                      >
                        Qty {item.quantity}
                      </span>
                      <span
                        className="price-text text-sm"
                        style={{ color: "var(--color-accent)" }}
                      >
                        {currency} {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </label>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Type + reason + customer info */}
      <div
        className="rounded-card card-shadow p-6 md:p-8 space-y-8"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div>
          <p
            className="text-[11px] uppercase font-medium mb-4"
            style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
          >
            Request Type
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(["refund", "exchange"] as ReturnRequestType[]).map((t) => {
              const active = requestType === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRequestType(t)}
                  className="text-[11px] uppercase font-medium rounded-[2px] py-4"
                  style={{
                    border: active
                      ? "1px solid var(--color-primary)"
                      : "1px solid var(--divider-soft)",
                    backgroundColor: active ? "var(--color-primary)" : "transparent",
                    color: active ? "#ffffff" : "var(--color-primary)",
                    letterSpacing: "0.18em",
                    transition: "all 0.2s ease",
                  }}
                >
                  {t === "refund" ? "Refund" : "Exchange"}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="block text-[11px] uppercase font-medium"
            style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
          >
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            placeholder="Please describe why you'd like to return or exchange this item"
            minLength={20}
            className="input-underline"
            style={{ resize: "vertical" }}
          />
          <p
            className="text-xs"
            style={{
              color:
                reason.trim().length > 0 && reason.trim().length < 20
                  ? "#dc2626"
                  : "rgba(42,61,46,0.4)",
            }}
          >
            {reason.trim().length}/20 characters minimum
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              className="block text-[11px] uppercase font-medium"
              style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
            >
              Your Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-underline"
            />
          </div>
          <div className="space-y-2">
            <label
              className="block text-[11px] uppercase font-medium"
              style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
            >
              Phone
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="input-underline"
            />
          </div>
        </div>
      </div>

      {step2Error && (
        <p className="text-sm" style={{ color: "#dc2626", lineHeight: 1.7 }}>
          {step2Error}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4">
        <button
          onClick={onBack}
          className="text-[11px] uppercase font-medium self-center"
          style={{
            color: "rgba(42,61,46,0.5)",
            letterSpacing: "0.18em",
          }}
        >
          ← Different order
        </button>
        <button
          onClick={onContinue}
          className="ml-auto text-[11px] uppercase font-medium text-white hover:opacity-85 rounded-[2px]"
          style={{
            backgroundColor: "var(--color-primary)",
            height: "52px",
            padding: "0 36px",
            letterSpacing: "0.25em",
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

// ─── Step 3 ─────────────────────────────────────────────────────────────────

interface Step3Props {
  products: ExchangeProduct[]
  allCount: number
  search: string
  setSearch: (s: string) => void
  selectedId: string | null
  setSelectedId: (id: string) => void
  selectedProduct: ExchangeProduct | null
  onBack: () => void
  onContinue: () => void
}

function Step3({
  products,
  allCount,
  search,
  setSearch,
  selectedId,
  setSelectedId,
  selectedProduct,
  onBack,
  onContinue,
}: Step3Props) {
  return (
    <div className="space-y-8">
      <div
        className="rounded-card card-shadow p-6 md:p-8 space-y-6"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div>
          <h2
            className="text-[22px] md:text-[28px] mb-2"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-primary)",
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            Pick a Replacement
          </h2>
          <p className="text-sm" style={{ color: "rgba(42,61,46,0.6)", lineHeight: 1.7 }}>
            Choose any in-stock item below as your exchange. Subject to admin approval.
          </p>
        </div>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name…"
          className="input-underline"
          aria-label="Search exchange products"
        />

        {/* Selected confirmation */}
        {selectedProduct && (
          <p
            className="text-sm rounded-[2px] px-4 py-3"
            style={{
              backgroundColor: "rgba(68,119,148,0.1)",
              borderLeft: "2px solid var(--color-accent)",
              color: "var(--color-primary)",
              lineHeight: 1.6,
            }}
          >
            You selected:{" "}
            <span style={{ fontWeight: 500 }}>{selectedProduct.name}</span>
          </p>
        )}

        {/* Grid */}
        {products.length === 0 ? (
          <p
            className="text-sm py-12 text-center"
            style={{ color: "rgba(42,61,46,0.5)", lineHeight: 1.7 }}
          >
            {allCount === 0
              ? "No products are currently in stock for exchange."
              : `No products matched "${search}".`}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => {
              const isSelected = selectedId === p.id
              const img = p.images?.[0]
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className="text-left group flex flex-col rounded-[4px] overflow-hidden"
                  style={{
                    backgroundColor: "#ffffff",
                    border: isSelected
                      ? "2px solid var(--color-accent)"
                      : "1px solid var(--divider-soft)",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected
                      ? "0 6px 24px rgba(68,119,148,0.18)"
                      : "0 2px 12px rgba(0,0,0,0.04)",
                  }}
                  aria-pressed={isSelected}
                >
                  <div
                    className="relative aspect-[3/4] overflow-hidden"
                    style={{ backgroundColor: "#DCD2BD" }}
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105"
                        style={{ transition: "transform 0.4s ease" }}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : null}
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm"
                        style={{ backgroundColor: "var(--color-accent)" }}
                        aria-hidden="true"
                      >
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <p
                      className="text-sm leading-snug"
                      style={{
                        color: "var(--color-primary)",
                        fontFamily: "var(--font-heading)",
                        fontWeight: 500,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {p.name}
                    </p>
                    <p
                      className="price-text text-sm"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {currency} {p.price.toLocaleString()}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4">
        <button
          onClick={onBack}
          className="text-[11px] uppercase font-medium self-center"
          style={{
            color: "rgba(42,61,46,0.5)",
            letterSpacing: "0.18em",
          }}
        >
          ← Back
        </button>
        <button
          onClick={onContinue}
          disabled={!selectedId}
          className="ml-auto text-[11px] uppercase font-medium text-white hover:opacity-85 disabled:opacity-50 rounded-[2px]"
          style={{
            backgroundColor: "var(--color-primary)",
            height: "52px",
            padding: "0 36px",
            letterSpacing: "0.25em",
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Review ─────────────────────────────────────────────────────────

interface Step4Props {
  order: Order
  productImages: Record<string, string | null>
  selectedItems: OrderItem[]
  requestType: ReturnRequestType
  reason: string
  customerName: string
  customerPhone: string
  exchangeProduct: ExchangeProduct | null
  submitLoading: boolean
  submitError: string
  onBack: () => void
  onSubmit: () => void
}

function Step4({
  order,
  productImages,
  selectedItems,
  requestType,
  reason,
  customerName,
  customerPhone,
  exchangeProduct,
  submitLoading,
  submitError,
  onBack,
  onSubmit,
}: Step4Props) {
  const shortId = formatOrderNumber(order.order_number)

  return (
    <div className="space-y-8">
      <div
        className="rounded-card card-shadow p-6 md:p-8 space-y-8"
        style={{ backgroundColor: "#ffffff" }}
      >
        <h2
          className="text-[22px] md:text-[28px]"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-primary)",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          Review Your Request
        </h2>

        <ReviewRow label="Order">
          <span className="font-mono">{shortId}</span>
        </ReviewRow>

        <ReviewRow label="Type">
          <span style={{ textTransform: "capitalize" }}>{requestType}</span>
        </ReviewRow>

        <ReviewRow label="Items">
          <ul className="space-y-3">
            {selectedItems.map((item, i) => {
              const variantLabel = item.variant
                ? Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(" · ")
                : null
              const img = productImages[item.product_id]
              return (
                <li key={i} className="flex items-start gap-3">
                  <div
                    className="relative w-14 aspect-[3/4] shrink-0 overflow-hidden rounded-[2px]"
                    style={{ backgroundColor: "#DCD2BD" }}
                  >
                    {img ? (
                      <Image src={img} alt={item.name} fill className="object-cover" sizes="56px" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm"
                      style={{
                        color: "var(--color-primary)",
                        fontFamily: "var(--font-heading)",
                        fontWeight: 500,
                      }}
                    >
                      {item.name}
                    </p>
                    {variantLabel && (
                      <p className="text-xs mt-0.5" style={{ color: "rgba(42,61,46,0.5)" }}>
                        {variantLabel}
                      </p>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: "rgba(42,61,46,0.5)" }}>
                      Qty {item.quantity}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </ReviewRow>

        {requestType === "exchange" && exchangeProduct && (
          <ReviewRow label="Exchange For">
            <div className="flex items-start gap-3">
              <div
                className="relative w-14 aspect-[3/4] shrink-0 overflow-hidden rounded-[2px]"
                style={{ backgroundColor: "#DCD2BD" }}
              >
                {exchangeProduct.images[0] ? (
                  <Image
                    src={exchangeProduct.images[0]}
                    alt={exchangeProduct.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : null}
              </div>
              <div>
                <p
                  className="text-sm"
                  style={{
                    color: "var(--color-primary)",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 500,
                  }}
                >
                  {exchangeProduct.name}
                </p>
                <p
                  className="price-text text-sm mt-0.5"
                  style={{ color: "var(--color-accent)" }}
                >
                  {currency} {exchangeProduct.price.toLocaleString()}
                </p>
              </div>
            </div>
          </ReviewRow>
        )}

        <ReviewRow label="Reason">
          <p className="whitespace-pre-line" style={{ lineHeight: 1.7 }}>
            {reason}
          </p>
        </ReviewRow>

        <ReviewRow label="Contact">
          <div>
            <p>{customerName}</p>
            <p style={{ color: "rgba(42,61,46,0.6)" }}>{customerPhone}</p>
          </div>
        </ReviewRow>
      </div>

      {submitError && (
        <p className="text-sm" style={{ color: "#dc2626", lineHeight: 1.7 }}>
          {submitError}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4">
        <button
          onClick={onBack}
          className="text-[11px] uppercase font-medium self-center"
          style={{
            color: "rgba(42,61,46,0.5)",
            letterSpacing: "0.18em",
          }}
        >
          ← Edit
        </button>
        <button
          onClick={onSubmit}
          disabled={submitLoading}
          className="ml-auto text-[11px] uppercase font-medium text-white hover:opacity-85 disabled:opacity-50 rounded-[2px]"
          style={{
            backgroundColor: "var(--color-accent)",
            height: "52px",
            padding: "0 36px",
            letterSpacing: "0.25em",
          }}
        >
          {submitLoading ? "Submitting…" : "Submit Request"}
        </button>
      </div>
    </div>
  )
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-6 pb-6"
      style={{ borderBottom: "1px solid var(--divider-soft)" }}
    >
      <p
        className="text-[10px] uppercase font-medium pt-1"
        style={{ color: "rgba(42,61,46,0.5)", letterSpacing: "0.18em" }}
      >
        {label}
      </p>
      <div className="text-sm" style={{ color: "var(--color-primary)" }}>
        {children}
      </div>
    </div>
  )
}

// ─── Step 5: Success ────────────────────────────────────────────────────────

function Step5({ requestId, phone }: { requestId: string | null; phone: string }) {
  const shortId = requestId ? requestId.slice(0, 8).toUpperCase() : null

  return (
    <div
      className="rounded-card card-shadow p-10 md:p-16 text-center space-y-6"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div
        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl"
        style={{
          backgroundColor: "rgba(68,119,148,0.1)",
          color: "var(--color-accent)",
        }}
        aria-hidden="true"
      >
        ✓
      </div>
      <div className="space-y-2">
        <h2
          className="text-[28px] md:text-[36px]"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-primary)",
            fontWeight: 500,
            letterSpacing: "0.02em",
            lineHeight: 1.2,
          }}
        >
          Request Submitted
        </h2>
        <p
          className="text-base"
          style={{ color: "rgba(42,61,46,0.6)", lineHeight: 1.8 }}
        >
          Your request has been submitted. We will contact you within 2 business
          days on{" "}
          <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
            {phone}
          </span>
          .
        </p>
      </div>

      {shortId && (
        <div
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-mono"
          style={{
            backgroundColor: "rgba(68,119,148,0.18)",
            color: "var(--color-accent)",
            fontWeight: 500,
          }}
        >
          <span
            className="text-xs font-sans"
            style={{ color: "rgba(42,61,46,0.5)", fontWeight: 400 }}
          >
            Request
          </span>
          #{shortId}
        </div>
      )}

      <Link
        href="/shop"
        className="inline-flex text-[11px] uppercase font-medium text-white hover:opacity-85 rounded-[2px] items-center justify-center"
        style={{
          backgroundColor: "var(--color-primary)",
          height: "52px",
          padding: "0 36px",
          letterSpacing: "0.25em",
        }}
      >
        Continue Shopping
      </Link>
    </div>
  )
}

