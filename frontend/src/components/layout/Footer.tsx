"use client"

import { useState } from "react"
import { storeConfig } from "@/config/store.config"

export default function Footer() {
  const { brand, contact, delivery } = storeConfig
  const year = new Date().getFullYear()

  return (
    <footer
      className="border-t mt-auto"
      style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Newsletter */}
        <div
          className="mb-10 pb-10 border-b"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="max-w-xl">
            <h3
              className="text-xl font-bold tracking-wider mb-1"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-accent)" }}
            >
              Stay in the Loop
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Be the first to know about new collections, exclusive offers, and style tips.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p
              className="text-2xl font-bold tracking-widest mb-2"
              style={{ color: "var(--color-accent)", fontFamily: "var(--font-heading)" }}
            >
              {brand.name}
            </p>
            <p className="text-white/60 text-sm leading-relaxed">{brand.tagline}</p>
          </div>

          {/* Delivery cities */}
          <div>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-4">
              We Deliver To
            </h3>
            <ul className="space-y-1">
              {delivery.cities.map((city) => (
                <li key={city} className="text-sm text-white/70">
                  {city}
                </li>
              ))}
            </ul>
          </div>

          {/* Social / Contact */}
          <div>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-4">
              Find Us
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  {contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://instagram.com/${contact.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Instagram: {contact.instagram}
                </a>
              </li>
              <li>
                <a
                  href={`https://facebook.com/${contact.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Facebook: {contact.facebook}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/40">
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
        className="flex items-center gap-2 px-4 py-3 rounded-sm text-sm font-medium"
        style={{ backgroundColor: "rgba(68,119,148,0.25)", color: storeConfig.theme.accentColor }}
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
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
          placeholder="your@email.com"
          required
          className="flex-1 h-11 px-3 text-sm bg-white/10 border text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors rounded-sm"
          style={{ borderColor: status === "error" ? "#f87171" : "rgba(255,255,255,0.2)" }}
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-11 px-5 text-xs uppercase tracking-widest font-semibold text-white shrink-0 rounded-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: storeConfig.theme.accentColor }}
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      </div>
      {status === "error" && message && (
        <p className="mt-2 text-xs text-red-400">{message}</p>
      )}
    </form>
  )
}
