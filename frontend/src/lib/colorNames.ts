import type { Product } from "@/types"

type ProductWithColorNames = Pick<Product, "color_names">

/**
 * Resolves a single variant value to its human-readable label. Currently only
 * the "Color" variant has a name map; other variants pass through unchanged.
 */
export function getVariantValueLabel(
  product: ProductWithColorNames | null | undefined,
  variantKey: string,
  value: string
): string {
  if (product && /colou?r/i.test(variantKey)) {
    const name = product.color_names?.[value]
    if (name && name.trim()) return name.trim()
  }
  return value
}

/**
 * Formats a `selectedVariants` map into a single human-readable string —
 * e.g. `{ Color: "#FF0000", Size: "M" }` → "Color: Red · Size: M".
 *
 * Keys for material / fabric / size_guide are filtered out (they're metadata,
 * not selectable options the customer cares to see in cart lines).
 */
export function formatVariantLabel(
  product: ProductWithColorNames | null | undefined,
  variants: Record<string, string> | undefined,
  joiner: string = " · "
): string {
  if (!variants) return ""
  return Object.entries(variants)
    .filter(([k]) => !/^(material|materials|fabric|size_guide)$/i.test(k))
    .map(([k, v]) => `${k}: ${getVariantValueLabel(product, k, v)}`)
    .join(joiner)
}
