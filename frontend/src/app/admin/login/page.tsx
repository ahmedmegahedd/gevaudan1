"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { storeConfig } from "@/config/store.config"
import { createClient } from "@/lib/supabase/client"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError("Invalid email or password.")
      setLoading(false)
      return
    }

    router.push("/admin")
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      <div className="w-full max-w-sm bg-white p-8 space-y-6">
        <div className="text-center">
          <p
            className="text-2xl font-bold tracking-wider mb-0.5"
            style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
          >
            {storeConfig.brand.name}
          </p>
          <p
            className="text-[10px] uppercase tracking-[0.3em] mb-1"
            style={{ color: "var(--color-accent)" }}
          >
            {storeConfig.brand.subtitle}
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-widest">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 px-3 text-base focus:outline-none focus:border-[var(--color-accent)]"
              style={{ minHeight: "48px" }}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 px-3 text-base focus:outline-none focus:border-[var(--color-accent)]"
              style={{ minHeight: "48px" }}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)", minHeight: "48px" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
