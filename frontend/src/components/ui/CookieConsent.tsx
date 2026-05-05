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
        className="pointer-events-auto w-full max-w-[480px] rounded-card overflow-hidden card-shadow"
        style={{
          backgroundColor: primaryColor,
          borderTop: `2px solid ${accentColor}`,
        }}
      >
        <div className="px-6 py-6 space-y-5">
          {/* Icon + text */}
          <div className="flex gap-3">
            <span className="text-xl shrink-0 mt-0.5" aria-hidden>🍪</span>
            <p className="text-sm" style={{ color: accentColor, lineHeight: 1.7 }}>
              We use cookies to improve your experience on{" "}
              <span style={{ color: "#ffffff", fontWeight: 500 }}>{storeConfig.brand.name}</span>.
              By continuing to browse, you agree to our use of cookies.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => dismiss("accepted")}
              className="flex-1 text-[11px] uppercase font-medium text-white hover:opacity-85 rounded-[2px]"
              style={{
                backgroundColor: accentColor,
                height: "44px",
                letterSpacing: "0.18em",
              }}
            >
              Accept
            </button>
            <button
              onClick={() => dismiss("declined")}
              className="flex-1 text-[11px] uppercase font-medium hover:opacity-70 rounded-[2px]"
              style={{
                border: `1px solid ${accentColor}`,
                color: accentColor,
                backgroundColor: "transparent",
                height: "44px",
                letterSpacing: "0.18em",
              }}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
