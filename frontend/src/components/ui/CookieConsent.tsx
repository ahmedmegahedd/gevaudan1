"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { storeConfig } from "@/config/store.config"

const STORAGE_KEY = "cookie-consent"
const { primaryColor, accentColor } = storeConfig.theme

export default function CookieConsent() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show on admin pages
    if (pathname.startsWith("/admin")) return
    // Don't show if already answered
    if (localStorage.getItem(STORAGE_KEY)) return
    // Small delay so the slide-up animation is visible
    const t = setTimeout(() => setVisible(true), 600)
    return () => clearTimeout(t)
  }, [pathname])

  function dismiss(choice: "accepted" | "declined") {
    localStorage.setItem(STORAGE_KEY, choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pointer-events-none"
      style={{ animation: "cookie-slide-up 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      <style>{`
        @keyframes cookie-slide-up {
          from { transform: translateY(110%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div
        className="pointer-events-auto w-full max-w-[480px] rounded-sm shadow-2xl overflow-hidden"
        style={{
          backgroundColor: primaryColor,
          borderTop: `2px solid ${accentColor}`,
        }}
      >
        <div className="px-5 py-4 space-y-4">
          {/* Icon + text */}
          <div className="flex gap-3">
            <span className="text-xl shrink-0 mt-0.5" aria-hidden>🍪</span>
            <p className="text-sm leading-relaxed" style={{ color: accentColor }}>
              We use cookies to improve your experience on{" "}
              <span className="font-semibold text-white">{storeConfig.brand.name}</span>.
              By continuing to browse, you agree to our use of cookies.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => dismiss("accepted")}
              className="flex-1 py-2.5 text-xs uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: accentColor }}
            >
              Accept
            </button>
            <button
              onClick={() => dismiss("declined")}
              className="flex-1 py-2.5 text-xs uppercase tracking-widest font-semibold border transition-opacity hover:opacity-70"
              style={{ borderColor: accentColor, color: accentColor, backgroundColor: "transparent" }}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
