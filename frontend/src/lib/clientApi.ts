/**
 * Client-side API helper — used in Client Components ("use client").
 * Calls Supabase directly. Image uploads go through the Next.js /api/upload route
 * which uses the service role key to bypass storage RLS.
 */
import { createClient } from "@/lib/supabase/client"
import type { OrderItem } from "@/types"

export const clientApi = {
  // ── Products ──────────────────────────────────────────────

  async toggleActive(id: string, isActive: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from("products")
      .update({ is_active: isActive })
      .eq("id", id)
    if (error) return { error: error.message }
    return { data: true }
  },

  async deleteProduct(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) return { error: error.message }
    return { data: true }
  },

  async createProduct(data: unknown) {
    const supabase = createClient()
    const { data: result, error } = await supabase
      .from("products")
      .insert(data as Record<string, unknown>)
      .select()
      .single()
    if (error) return { error: error.message }
    return { data: result }
  },

  async updateProduct(id: string, data: unknown) {
    const supabase = createClient()
    const { data: result, error } = await supabase
      .from("products")
      .update(data as Record<string, unknown>)
      .eq("id", id)
      .select()
      .single()
    if (error) return { error: error.message }
    return { data: result }
  },

  // ── Image upload — hits the Next.js /api/upload route ─────

  async uploadImage(file: File): Promise<{ data?: { url: string }; error?: string }> {
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) return { error: json.error ?? "Upload failed" }
      return { data: json }
    } catch {
      return { error: "Upload failed" }
    }
  },

  // ── Orders ────────────────────────────────────────────────

  async updateOrderStatus(id: string, status: string) {
    const supabase = createClient()
    const { data: result, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single()
    if (error) return { error: error.message }
    return { data: result }
  },

  async placeOrder(order: {
    customer_info: { name: string; phone: string }
    delivery_address: { city: string; address: string; notes?: string }
    items: OrderItem[]
    subtotal: number
    delivery_fee: number
    discount_amount?: number
    total: number
    promo_code?: string | null
  }): Promise<{ data?: { id: string }; error?: string }> {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      })
      const json = await res.json()
      if (!res.ok) return { error: json.error ?? "Failed to place order" }
      return { data: json as { id: string } }
    } catch {
      return { error: "Network error — please try again" }
    }
  },

  // ── Categories ────────────────────────────────────────────

  async createCategory(data: { name: string; slug: string; is_active: boolean; image_url: string | null }) {
    const supabase = createClient()
    const { data: result, error } = await supabase
      .from("categories")
      .insert(data)
      .select()
      .single()
    if (error) return { error: error.message }
    return { data: result as { id: string } }
  },

  async updateCategory(id: string, data: { name: string; slug: string; is_active: boolean; image_url: string | null }) {
    const supabase = createClient()
    const { error } = await supabase.from("categories").update(data).eq("id", id)
    if (error) return { error: error.message }
    return { data: true }
  },

  async deleteCategory(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) return { error: error.message }
    return { data: true }
  },

  async setProductCategory(productId: string, categoryId: string | null) {
    const supabase = createClient()
    const { error } = await supabase
      .from("products")
      .update({ category_id: categoryId })
      .eq("id", productId)
    if (error) return { error: error.message }
    return { data: true }
  },

  // ── Collections ───────────────────────────────────────────

  async createCollection(data: unknown) {
    const supabase = createClient()
    const { data: result, error } = await supabase
      .from("collections")
      .insert(data as Record<string, unknown>)
      .select()
      .single()
    if (error) return { error: error.message }
    return { data: result as { id: string } }
  },

  async updateCollection(id: string, data: unknown) {
    const supabase = createClient()
    const { error } = await supabase
      .from("collections")
      .update(data as Record<string, unknown>)
      .eq("id", id)
    if (error) return { error: error.message }
    return { data: true }
  },

  async deleteCollection(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("collections").delete().eq("id", id)
    if (error) return { error: error.message }
    return { data: true }
  },

  async addProductToCollection(collectionId: string, productId: string, displayOrder: number) {
    const supabase = createClient()
    const { error } = await supabase
      .from("collection_products")
      .insert({ collection_id: collectionId, product_id: productId, display_order: displayOrder })
    if (error) return { error: error.message }
    return { data: true }
  },

  async removeProductFromCollection(collectionId: string, productId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from("collection_products")
      .delete()
      .eq("collection_id", collectionId)
      .eq("product_id", productId)
    if (error) return { error: error.message }
    return { data: true }
  },

  async updateCollectionProductOrder(collectionId: string, productId: string, displayOrder: number) {
    const supabase = createClient()
    const { error } = await supabase
      .from("collection_products")
      .update({ display_order: displayOrder })
      .eq("collection_id", collectionId)
      .eq("product_id", productId)
    if (error) return { error: error.message }
    return { data: true }
  },
}
