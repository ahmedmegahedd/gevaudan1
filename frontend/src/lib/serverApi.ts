/**
 * Server-side data helpers — used in React Server Components.
 * Calls Supabase directly. No separate backend server required.
 */
import { createClient } from "@/lib/supabase/server"
import type { Category, Collection, CollectionProduct, Order, Product } from "@/types"

type ProductWithCategory = Product & {
  category: { id: string; name: string; slug: string } | null
}

interface Stats {
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  totalRevenue: number
}

export const serverApi = {
  async stats(): Promise<Stats> {
    const supabase = await createClient()
    const [
      { count: totalOrders },
      { count: pendingOrders },
      { count: totalProducts },
      { data: revenueData },
    ] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase.from("orders").select("total").eq("status", "delivered"),
    ])
    const totalRevenue = (revenueData ?? []).reduce(
      (sum: number, o: { total: number }) => sum + (o.total ?? 0),
      0
    )
    return {
      totalOrders: totalOrders ?? 0,
      pendingOrders: pendingOrders ?? 0,
      totalProducts: totalProducts ?? 0,
      totalRevenue,
    }
  },

  async orders(): Promise<Order[]> {
    const supabase = await createClient()
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
    return (data ?? []) as Order[]
  },

  async products(params?: string): Promise<ProductWithCategory[]> {
    const supabase = await createClient()
    const sp = new URLSearchParams(params)

    let query = supabase
      .from("products")
      .select("*, category:categories(id,name,slug)")
      .order("created_at", { ascending: false })

    if (sp.get("active") === "true") query = query.eq("is_active", true)
    if (sp.get("featured") === "true") query = query.eq("is_featured", true)

    const { data } = await query
    let result = (data ?? []) as ProductWithCategory[]

    const category = sp.get("category")
    if (category) {
      result = result.filter((p) => p.category?.slug === category)
    }

    return result
  },

  async product(slugOrId: string): Promise<ProductWithCategory | null> {
    const supabase = await createClient()

    // Try slug first
    const { data: bySlug } = await supabase
      .from("products")
      .select("*, category:categories(id,name,slug)")
      .eq("slug", slugOrId)
      .maybeSingle()

    if (bySlug) return bySlug as ProductWithCategory

    // Fallback to UUID
    const { data: byId } = await supabase
      .from("products")
      .select("*, category:categories(id,name,slug)")
      .eq("id", slugOrId)
      .maybeSingle()

    return (byId as ProductWithCategory | null) ?? null
  },

  async categories(params?: string): Promise<Category[]> {
    const supabase = await createClient()
    const sp = new URLSearchParams(params)

    let query = supabase.from("categories").select("*").order("name")
    if (sp.get("active") === "true") query = query.eq("is_active", true)

    const { data } = await query
    return (data ?? []) as Category[]
  },

  async collections(): Promise<(Collection & { product_count: number })[]> {
    const supabase = await createClient()
    const [{ data: cols }, { data: cps }] = await Promise.all([
      supabase.from("collections").select("*").order("display_order"),
      supabase.from("collection_products").select("collection_id"),
    ])
    const countMap: Record<string, number> = {}
    for (const cp of cps ?? []) {
      countMap[cp.collection_id] = (countMap[cp.collection_id] || 0) + 1
    }
    return (cols ?? []).map((c) => ({ ...c, product_count: countMap[c.id] || 0 })) as (Collection & { product_count: number })[]
  },

  async collection(slug: string): Promise<(Collection & { products: CollectionProduct[] }) | null> {
    const supabase = await createClient()
    const { data: col } = await supabase
      .from("collections")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
    if (!col) return null

    const { data: cps } = await supabase
      .from("collection_products")
      .select("*, product:products(*, category:categories(*))")
      .eq("collection_id", col.id)
      .order("display_order")

    return { ...col, products: (cps ?? []) as CollectionProduct[] } as Collection & { products: CollectionProduct[] }
  },

  async collectionById(id: string): Promise<(Collection & { products: CollectionProduct[] }) | null> {
    const supabase = await createClient()
    const { data: col } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (!col) return null

    const { data: cps } = await supabase
      .from("collection_products")
      .select("*, product:products(*, category:categories(*))")
      .eq("collection_id", col.id)
      .order("display_order")

    return { ...col, products: (cps ?? []) as CollectionProduct[] } as Collection & { products: CollectionProduct[] }
  },
}
