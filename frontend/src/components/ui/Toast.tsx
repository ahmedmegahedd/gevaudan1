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
    <div className="fixed top-20 right-4 sm:right-6 z-[100] flex flex-col gap-3 max-w-sm w-[calc(100%-2rem)] sm:w-full pointer-events-none">
      {toasts.map((toast) => {
        const accent = accentByType[toast.type] ?? "var(--color-accent)"
        return (
          <div
            key={toast.id}
            className="luxe-toast relative flex items-center gap-4 pl-5 pr-4 py-4 pointer-events-auto overflow-hidden"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "#fff",
              boxShadow: "0 10px 40px rgba(6, 18, 34, 0.35)",
              borderLeft: `3px solid ${accent}`,
            }}
            role="alert"
          >
            {/* Icon */}
            <span
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full"
              style={{ backgroundColor: `${accent}22`, color: accent }}
              aria-hidden="true"
            >
              {toast.type === "success" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : toast.type === "error" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </span>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-0.5"
                style={{ color: accent }}
              >
                {toast.type === "success" ? "Success" : toast.type === "error" ? "Error" : "Notice"}
              </p>
              <p
                className="text-sm leading-snug text-white/95 truncate"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {toast.message}
              </p>
            </div>

            {/* Close */}
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-white/50 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
