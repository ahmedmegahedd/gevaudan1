/** Keys that are NOT selectable variants (excluded from combination keys) */
const SPECIAL_KEYS = /^(material|materials|fabric|size_guide)$/i

/**
 * Returns the ordered list of "real" variant keys for a product
 * (excludes material, size_guide, etc.)
 */
export function getRealVariantKeys(variants: Record<string, string[]>): string[] {
  return Object.keys(variants).filter((k) => !SPECIAL_KEYS.test(k))
}

/**
 * Build the variant stock key from the currently selected variant values.
 * e.g. selectedVariants = { Size: "M", Color: "Black" } → "M|Black"
 */
export function buildVariantKey(
  selectedVariants: Record<string, string>,
  realKeys: string[]
): string {
  return realKeys.map((k) => selectedVariants[k] ?? "").join("|")
}

/**
 * Look up the stock for a specific variant combination.
 * Falls back to product.stock if variant_stock is not defined or the key is missing.
 */
export function getVariantStock(
  productStock: number,
  variantStock: Record<string, number> | undefined | null,
  selectedVariants: Record<string, string>,
  realKeys: string[]
): number {
  if (!variantStock || Object.keys(variantStock).length === 0) return productStock
  const key = buildVariantKey(selectedVariants, realKeys)
  if (!(key in variantStock)) return productStock
  return variantStock[key]
}

/**
 * Generate all combinations (cartesian product) from an array of option arrays.
 * e.g. [["S","M"], ["Black","White"]] → [["S","Black"],["S","White"],["M","Black"],["M","White"]]
 */
export function cartesian(arrays: string[][]): string[][] {
  if (arrays.length === 0) return []
  return arrays.reduce<string[][]>(
    (acc, opts) => acc.flatMap((prev) => opts.map((o) => [...prev, o])),
    [[]]
  )
}
