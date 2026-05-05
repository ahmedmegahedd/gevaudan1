/**
 * Review aggregation helpers (server-side).
 *
 * Each function takes a list of product ids, runs ONE query against the
 * `reviews` table for the entire batch (no N+1), then returns aggregates.
 */
import { createClient } from "@/lib/supabase/server"

export interface RatingAggregate {
  avg: number
  count: number
}

/**
 * Returns a map of product_id → { avg, count } for all approved reviews
 * belonging to the given product ids.
 */
export async function fetchRatingMap(
  productIds: string[]
): Promise<Map<string, RatingAggregate>> {
  if (productIds.length === 0) return new Map()

  const supabase = await createClient()
  const { data } = await supabase
    .from("reviews")
    .select("product_id, rating")
    .eq("is_approved", true)
    .in("product_id", productIds)

  const accum = new Map<string, { sum: number; count: number }>()
  for (const row of (data as { product_id: string; rating: number }[] | null) ?? []) {
    const cur = accum.get(row.product_id) ?? { sum: 0, count: 0 }
    cur.sum += row.rating
    cur.count += 1
    accum.set(row.product_id, cur)
  }

  const result = new Map<string, RatingAggregate>()
  accum.forEach((v, id) => {
    result.set(id, { avg: v.sum / v.count, count: v.count })
  })
  return result
}

/**
 * Attaches `avg_rating` and `review_count` fields to every product in `items`
 * that has at least one approved review. Products without reviews are returned
 * unchanged (the consumer can null-check the optional fields).
 */
export async function attachRatings<T extends { id: string }>(
  items: T[]
): Promise<(T & { avg_rating?: number; review_count?: number })[]> {
  const map = await fetchRatingMap(items.map((i) => i.id))
  return items.map((item) => {
    const r = map.get(item.id)
    if (!r) return item
    return { ...item, avg_rating: r.avg, review_count: r.count }
  })
}
