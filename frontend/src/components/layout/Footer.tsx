"use client"

import { useState } from "react"
import { storeConfig } from "@/config/store.config"

export default function Footer() {
  const { brand, contact, delivery } = storeConfig
  const year = new Date().getFullYear()

  return (
    <footer
      className="mt-auto"
      style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-16 md:py-24">
        {/* Newsletter */}
        <div
          className="mb-16 pb-16"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="max-w-xl">
            <h3
              className="text-2xl md:text-3xl mb-3"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-accent)",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Stay in the Loop
            </h3>
            <p
              className="text-sm mb-6"
              style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}
            >
              Be the first to know about new collections, exclusive offers, and style tips.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {/* Brand */}
          <div>
            <p
              className="text-3xl mb-3"
              style={{
                color: "var(--color-accent)",
                fontFamily: "var(--font-heading)",
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              {brand.name}
            </p>
            <p
              className="text-sm"
              style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}
            >
              {brand.tagline}
            </p>
          </div>

          {/* Delivery cities */}
          <div>
            <h3
              className="text-[10px] uppercase font-medium mb-6"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em" }}
            >
              We Deliver To
            </h3>
            <ul className="space-y-2">
              {delivery.cities.map((city) => (
                <li key={city} className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {city}
                </li>
              ))}
            </ul>
          </div>

          {/* Social / Contact */}
          <div>
            <h3
              className="text-[10px] uppercase font-medium mb-6"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em" }}
            >
              Find Us
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-sm hover:text-white"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://instagram.com/${contact.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  Instagram: {contact.instagram}
                </a>
              </li>
              <li>
                <a
                  href={`https://facebook.com/${contact.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  Facebook: {contact.facebook}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-16 pt-8 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <p
            className="text-[11px] uppercase"
            style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em" }}
          >
            &copy; {year} {brand.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setMessage(data.error ?? "Something went wrong.")
      } else {
        setStatus("success")
        setEmail("")
        setMessage("You're subscribed! Welcome to the family.")
      }
    } catch {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  if (status === "success") {
    return (
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-card text-sm"
        style={{
          backgroundColor: "rgba(68,119,148,0.25)",
          color: storeConfig.theme.accentColor,
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {message}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex gap-3 items-end">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
          placeholder="your@email.com"
          required
          className="flex-1 text-base focus:outline-none"
          style={{
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${status === "error" ? "#f87171" : "rgba(255,255,255,0.2)"}`,
            color: "#fff",
            padding: "12px 2px",
            minHeight: "52px",
            borderRadius: 0,
          }}
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="text-[11px] uppercase font-medium text-white shrink-0 hover:opacity-85 disabled:opacity-50 rounded-[2px]"
          style={{
            backgroundColor: storeConfig.theme.accentColor,
            height: "52px",
            padding: "0 28px",
            letterSpacing: "0.2em",
          }}
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      </div>
      {status === "error" && message && (
        <p className="mt-3 text-xs" style={{ color: "#fca5a5" }}>{message}</p>
      )}
    </form>
  )
}
