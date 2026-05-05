"use client"

import { useToastStore } from "@/store/toastStore"

const accentByType: Record<string, string> = {
  success: "var(--color-accent)",
  error: "#b91c1c",
  info: "var(--color-accent)",
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-[calc(100%-2rem)] max-w-md pointer-events-none">
      {toasts.map((toast) => {
        const accent = accentByType[toast.type] ?? "var(--color-accent)"
        return (
          <div
            key={toast.id}
            className="luxe-toast relative flex items-center gap-5 px-6 py-5 pointer-events-auto overflow-hidden"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "#fff",
              boxShadow: "0 20px 60px rgba(61, 20, 25, 0.55), 0 0 0 1px rgba(255,255,255,0.06)",
              borderLeft: `4px solid ${accent}`,
            }}
            role="alert"
          >
            {/* Icon — large circular badge */}
            <span
              className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full"
              style={{ backgroundColor: `${accent}22`, color: accent }}
              aria-hidden="true"
            >
              {toast.type === "success" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : toast.type === "error" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </span>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] uppercase tracking-[0.25em] font-semibold mb-1.5"
                style={{ color: accent }}
              >
                {toast.type === "success" ? "Success" : toast.type === "error" ? "Error" : "Notice"}
              </p>
              <p
                className="text-lg leading-snug text-white/95"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {toast.message}
              </p>
            </div>

            {/* Close */}
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-white/50 hover:text-white transition-colors self-start -mt-1"
              aria-label="Dismiss"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
