"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  orderId: string
}

type Phase = "loading" | "ready" | "error"

/**
 * Calls /api/payment/paymob/init for the given order, then renders the
 * resulting Paymob iframe. Customer fills in card details inside the iframe;
 * Paymob redirects the parent window after they pay (URL configured in the
 * Paymob dashboard — set it to /checkout/result on this domain).
 */
export default function PaymobIframe({ orderId }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("loading")
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await fetch("/api/payment/paymob/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
        })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok || !json.iframeUrl) {
          setError(json.error ?? "Could not initialise payment.")
          setPhase("error")
          return
        }
        setIframeUrl(json.iframeUrl)
        setPhase("ready")
      } catch {
        if (cancelled) return
        setError("Network error. Please try again.")
        setPhase("error")
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [orderId])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-20">
      <div className="text-center mb-10 md:mb-14">
        <p
          className="text-[11px] uppercase mb-4"
          style={{ color: "var(--color-accent)", letterSpacing: "0.3em" }}
        >
          Secure Payment
        </p>
        <h1
          className="text-[28px] md:text-[40px]"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-primary)",
            fontWeight: 500,
            letterSpacing: "0.02em",
            lineHeight: 1.1,
          }}
        >
          Complete Your Order
        </h1>
        <p
          className="text-sm md:text-base mt-3"
          style={{ color: "rgba(42,61,46,0.6)", lineHeight: 1.7 }}
        >
          You&rsquo;re paying through Paymob&rsquo;s secure card form. We never
          see your card details.
        </p>
      </div>

      <div
        className="rounded-card overflow-hidden card-shadow"
        style={{ backgroundColor: "#ffffff", minHeight: 720 }}
      >
        {phase === "loading" && (
          <div className="py-32 text-center">
            <p
              className="text-sm"
              style={{ color: "rgba(42,61,46,0.55)", lineHeight: 1.7 }}
            >
              Preparing secure checkout…
            </p>
          </div>
        )}

        {phase === "error" && (
          <div className="py-20 px-6 text-center space-y-6">
            <p
              className="text-base"
              style={{ color: "#dc2626", lineHeight: 1.7 }}
            >
              {error}
            </p>
            <button
              type="button"
              onClick={() => router.push("/checkout")}
              className="text-[11px] uppercase font-medium text-white hover:opacity-85 rounded-[2px]"
              style={{
                backgroundColor: "var(--color-primary)",
                height: "52px",
                padding: "0 36px",
                letterSpacing: "0.25em",
              }}
            >
              Back to Checkout
            </button>
          </div>
        )}

        {phase === "ready" && iframeUrl && (
          <iframe
            src={iframeUrl}
            title="Paymob secure card payment"
            // Paymob recommends ≥720px so 3-D Secure / OTP modals render correctly
            style={{ width: "100%", minHeight: 720, border: "none", display: "block" }}
            allow="payment"
          />
        )}
      </div>
    </div>
  )
}
