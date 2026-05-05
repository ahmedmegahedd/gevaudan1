/**
 * Customer-facing order number formatting.
 *
 * Stored in `orders.order_number` as a Postgres sequence. Display as
 * `G` + minimum 5-digit zero-padded number — naturally grows past 5 digits
 * once we exceed 99,999 orders, so it's "G00001 → G99999 → G100000 → ∞".
 */
export function formatOrderNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return ""
  return `G${String(n).padStart(5, "0")}`
}

/**
 * Parses a customer-entered order ref. Accepts:
 *   "G00012", "g12", "12", "  G 0012  "   →  12
 * Returns null when there's no usable digit run.
 */
export function parseOrderNumber(input: string): number | null {
  const cleaned = input.trim().toUpperCase().replace(/^G/, "").replace(/[^0-9]/g, "")
  if (!cleaned) return null
  const n = parseInt(cleaned, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}
