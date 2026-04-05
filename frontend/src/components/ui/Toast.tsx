"use client"

import { useToastStore } from "@/store/toastStore"

const icons: Record<string, string> = {
  success: "✓",
  error: "✕",
  info: "i",
}

const colors: Record<string, string> = {
  success: "#10b981",
  error: "#ef4444",
  info: "#3b82f6",
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-3 px-4 py-3 text-white shadow-lg pointer-events-auto"
          style={{ backgroundColor: colors[toast.type] }}
          role="alert"
        >
          <span className="shrink-0 font-bold text-sm w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            {icons[toast.type]}
          </span>
          <p className="text-sm flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/70 hover:text-white transition-colors text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
