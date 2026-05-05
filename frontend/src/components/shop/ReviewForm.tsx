"use client"

import { useState } from "react"
import { z } from "zod"

const schema = z.object({
  product_id: z.string().uuid(),
  display_name: z.string().trim().min(2, "Display name must be at least 2 characters"),
  review_text: z.string().trim().min(20, "Review must be at least 20 characters"),
  rating: z.number().int().min(1, "Please select a star rating").max(5),
})

interface ReviewFormProps {
  productId: string
}

type Status = "idle" | "loading" | "success" | "error"

export default function ReviewForm({ productId }: ReviewFormProps) {
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    const parsed = schema.safeParse({
      product_id: productId,
      display_name: name,
      review_text: text,
      rating,
    })

    if (!parsed.success) {
      setStatus("error")
      setErrorMessage(parsed.error.issues[0].message)
      return
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus("error")
        setErrorMessage(json.error ?? "Something went wrong. Please try again.")
        return
      }
      setStatus("success")
      setName("")
      setText("")
      setRating(0)
    } catch {
      setStatus("error")
      setErrorMessage("Network error. Please try again.")
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-card card-shadow p-8"
        style={{ backgroundColor: "#ffffff" }}
      >
        <p
          className="text-base"
          style={{ color: "var(--color-accent)", lineHeight: 1.7 }}
        >
          Thank you! Your review will appear after approval.
        </p>
      </div>
    )
  }

  const showStarValue = hoverRating || rating

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-card card-shadow p-8 space-y-6"
      style={{ backgroundColor: "#ffffff" }}
    >
      <h3
        className="text-[22px] md:text-[28px]"
        style={{
          fontFamily: "var(--font-heading)",
          color: "var(--color-primary)",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        Write a Review
      </h3>

      {/* Star picker */}
      <div className="space-y-3">
        <label
          className="block text-[11px] uppercase font-medium"
          style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
        >
          Rating
        </label>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = showStarValue >= n
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                aria-label={`Rate ${n} ${n === 1 ? "star" : "stars"}`}
                className="leading-none p-1"
                style={{
                  fontSize: 28,
                  color: filled ? "var(--color-accent)" : "rgba(61,20,25,0.2)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ★
              </button>
            )
          })}
        </div>
      </div>

      {/* Display name */}
      <div className="space-y-2">
        <label
          className="block text-[11px] uppercase font-medium"
          style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
        >
          Display Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (status === "error") setStatus("idle")
          }}
          placeholder="Jane D."
          required
          maxLength={80}
          className="input-underline"
        />
      </div>

      {/* Review text */}
      <div className="space-y-2">
        <label
          className="block text-[11px] uppercase font-medium"
          style={{ color: "var(--color-primary)", letterSpacing: "0.15em" }}
        >
          Your Review
        </label>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (status === "error") setStatus("idle")
          }}
          placeholder="Share your thoughts on the fit, quality, and styling…"
          required
          minLength={20}
          maxLength={4000}
          className="input-underline"
          style={{ resize: "vertical" }}
        />
        <p
          className="text-xs"
          style={{
            color:
              text.trim().length > 0 && text.trim().length < 20
                ? "#dc2626"
                : "rgba(61,20,25,0.4)",
          }}
        >
          {text.trim().length}/20 characters minimum
        </p>
      </div>

      {status === "error" && (
        <p className="text-sm" style={{ color: "#dc2626" }}>
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="text-[11px] uppercase font-medium text-white hover:opacity-85 disabled:opacity-50 rounded-[2px]"
        style={{
          backgroundColor: "var(--color-primary)",
          height: "52px",
          padding: "0 40px",
          letterSpacing: "0.25em",
        }}
      >
        {status === "loading" ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  )
}
