import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/types"

/**
 * Returns up to 4 recommended products.
 * Strategy: same-category products first (excluding current), shuffled.
 * Falls back to featured products if not enough from the category.
 */
export async function getRecommendedProducts(
  options: { categoryId?: string | null; excludeIds: string[] },
  limit = 4
): Promise<Product[]> {
  const supabase = await createClient()
  const { categoryId, excludeIds } = options

  const candidates: Product[] = []

  // 1. Same category (if category exists)
  if (categoryId) {
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .eq("category_id", categoryId)
      .not("id", "in", `(${excludeIds.join(",")})`)
      .limit(20)

    if (data) candidates.push(...(data as Product[]))
  }

  // 2. Fill from featured if we don't have enough
  if (candidates.length < limit) {
    const needed = limit - candidates.length
    const existingIds = [...excludeIds, ...candidates.map((p) => p.id)]

    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .eq("is_featured", true)
      .not("id", "in", `(${existingIds.join(",")})`)
      .limit(needed + 8) // fetch extra so shuffle has variety

    if (data) candidates.push(...(data as Product[]))
  }

  // 3. Shuffle and cap at limit
  return shuffle(candidates).slice(0, limit)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
