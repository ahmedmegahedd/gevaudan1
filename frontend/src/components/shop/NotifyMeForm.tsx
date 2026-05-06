"use client"

import { useState } from "react"

interface NotifyMeFormProps {
  productId: string
  variantInfo?: Record<string, string> | null
  /** When true, render the trigger + form on a dark surface (mobile sticky bar) */
  variant?: "light" | "dark"
}

type Status = "idle" | "loading" | "success" | "already" | "error"

export default function NotifyMeForm({ productId, variantInfo, variant = "light" }: NotifyMeFormProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const isDark = variant === "dark"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setStatus("loading")
    setErrorMessage("")

    try {
      const res = await fetch("/api/stock-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          email: trimmed,
          variant_info: variantInfo && Object.keys(variantInfo).length > 0 ? variantInfo : null,
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        setStatus("error")
        setErrorMessage(json.error ?? "Something went wrong. Please try again.")
        return
      }
      if (json.alreadySubscribed) {
        setStatus("already")
        return
      }
      setStatus("success")
      setEmail("")
    } catch {
      setStatus("error")
      setErrorMessage("Network error. Please try again.")
    }
  }

  // ── Success states ──
  if (status === "success") {
    return (
      <p
        className="text-sm text-center"
        style={{
          color: isDark ? "rgba(255,255,255,0.85)" : "var(--color-accent)",
          lineHeight: 1.7,
        }}
      >
        We&rsquo;ll email you when this product is back in stock.
      </p>
    )
  }

  if (status === "already") {
    return (
      <p
        className="text-sm text-center"
        style={{
          color: isDark ? "rgba(255,255,255,0.85)" : "var(--color-accent)",
          lineHeight: 1.7,
        }}
      >
        You&rsquo;re on the waitlist.
      </p>
    )
  }

  // ── Trigger button (collapsed) ──
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-[11px] uppercase font-medium rounded-[2px] hover:opacity-85"
        style={{
          height: "52px",
          letterSpacing: "0.25em",
          backgroundColor: isDark ? "transparent" : "var(--color-primary)",
          color: "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.3)" : "1px solid var(--color-primary)",
        }}
      >
        Notify Me When Available
      </button>
    )
  }

  // ── Inline form (expanded) ──
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <label
        className="text-[11px] uppercase font-medium"
        style={{
          color: isDark ? "rgba(255,255,255,0.7)" : "var(--color-primary)",
          letterSpacing: "0.15em",
        }}
      >
        Notify me when available
      </label>
      <div className="flex gap-2 items-stretch">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === "error") setStatus("idle")
          }}
          placeholder="your@email.com"
          required
          autoFocus
          aria-label="Email address"
          className="flex-1 text-base focus:outline-none"
          style={{
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${
              status === "error"
                ? "#ef4444"
                : isDark
                  ? "rgba(255,255,255,0.3)"
                  : "rgba(42,61,46,0.2)"
            }`,
            color: isDark ? "#ffffff" : "var(--color-primary)",
            padding: "12px 2px",
            minHeight: "52px",
            borderRadius: 0,
          }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="text-[11px] uppercase font-medium shrink-0 rounded-[2px] hover:opacity-85 disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "#ffffff",
            height: "52px",
            padding: "0 24px",
            letterSpacing: "0.18em",
          }}
        >
          {status === "loading" ? "…" : "Submit"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs" style={{ color: "#fca5a5" }}>
          {errorMessage}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setOpen(false)
          setStatus("idle")
        }}
        className="text-[10px] uppercase self-start hover:opacity-100"
        style={{
          color: isDark ? "rgba(255,255,255,0.5)" : "rgba(42,61,46,0.5)",
          letterSpacing: "0.18em",
        }}
      >
        Cancel
      </button>
    </form>
  )
}
