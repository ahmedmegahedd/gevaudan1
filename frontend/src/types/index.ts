// ────────────────────────────────────────────────────────────
// Store Config Type
// ────────────────────────────────────────────────────────────
export interface StoreConfig {
  brand: {
    name: string
    tagline: string
    logo: string
    whatsapp: string
  }
  theme: {
    primaryColor: string
    accentColor: string
    fontHeading: string
    fontBody: string
  }
  contact: {
    email: string
    instagram: string
    facebook: string
  }
  delivery: {
    cities: string[]
    fee: number
    freeAbove: number
    currency: string
  }
  products: {
    sizes: string[]
    categories: string[]
  }
}

// ────────────────────────────────────────────────────────────
// Database Types (match Supabase schema)
// ────────────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  slug: string
  image_url: string | null
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  composition: string | null
  measurements: string | null
  price: number
  images: string[]
  category_id: string | null
  /** Generic variant map: e.g. { size: ["S","M","L"], color: ["Black","White"] } */
  variants: Record<string, string[]>
  stock: number
  /** Per-combination stock: key = variant values joined by "|", e.g. "M|Black": 5 */
  variant_stock: Record<string, number> | null
  /** Per-color stock for color-only availability checks: { "#FF0000": 5, "#0000FF": 0 } */
  stock_by_variant: Record<string, number> | null
  /** Maps color name → image URL, e.g. { "Black": "https://..." } */
  color_images: Record<string, string> | null
  is_active: boolean
  is_featured: boolean
  model_info: string | null
  created_at: string
  /** Populated when joined */
  category?: Category
  /** Optional review aggregates — populated by `attachRatings()` on the server. */
  avg_rating?: number
  review_count?: number
}

// ────────────────────────────────────────────────────────────
// Reviews
// ────────────────────────────────────────────────────────────

/**
 * Review.is_approved is tri-state:
 *   null  → pending (default for new submissions)
 *   true  → approved (visible to customers)
 *   false → rejected (admin explicitly hid it)
 */
export interface Review {
  id: string
  product_id: string
  display_name: string
  review_text: string
  rating: number
  is_approved: boolean | null
  created_at: string
  /** Populated by admin queries */
  product?: { name: string; slug: string } | null
}

export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled"

export interface CustomerInfo {
  name: string
  phone: string
  /** Optional — collected on checkout for transactional emails. */
  email?: string
}

export interface DeliveryAddress {
  city: string
  address: string
  notes?: string
}

export interface OrderItem {
  product_id: string
  name: string
  price: number
  quantity: number
  /** Selected variant values, e.g. { size: "M", color: "Black" } */
  variant?: Record<string, string>
}

export interface Order {
  id: string
  /** Sequential, customer-facing order number (e.g. 1, 2, 3 …). Display via `formatOrderNumber()`. */
  order_number: number
  customer_info: CustomerInfo
  delivery_address: DeliveryAddress
  items: OrderItem[]
  subtotal: number
  delivery_fee: number
  discount_amount: number
  total: number
  promo_code: string | null
  status: OrderStatus
  created_at: string
}

export interface PromoCode {
  id: string
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  min_order_amount: number
  max_uses: number | null
  times_used: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

// ────────────────────────────────────────────────────────────
// Returns & Exchanges
// ────────────────────────────────────────────────────────────

export type ReturnRequestType = "refund" | "exchange"
export type ReturnRequestStatus = "pending" | "approved" | "rejected"

export interface ReturnRequestItem {
  product_id: string
  name: string
  price: number
  quantity: number
  variant?: Record<string, string>
}

export interface ReturnRequest {
  id: string
  order_id: string
  customer_name: string
  customer_phone: string
  request_type: ReturnRequestType
  reason: string
  items: ReturnRequestItem[]
  exchange_product_id: string | null
  status: ReturnRequestStatus
  admin_notes: string | null
  created_at: string
  /** Populated by joins (admin) */
  order?: Order | null
  exchange_product?: { id: string; name: string; slug: string; price: number; images: string[] } | null
}

// ────────────────────────────────────────────────────────────
// Collections
// ────────────────────────────────────────────────────────────
export interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  cover_image: string | null
  is_active: boolean
  display_order: number
  created_at: string
  /** Populated via join or JS count */
  product_count?: number
}

export interface CollectionProduct {
  collection_id: string
  product_id: string
  display_order: number
  product?: Product & { category?: Category }
}

// ────────────────────────────────────────────────────────────
// Cart Types (client-side only)
// ────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product
  quantity: number
  /** Selected variant values, e.g. { size: "M", color: "Black" } */
  selectedVariants: Record<string, string>
}
