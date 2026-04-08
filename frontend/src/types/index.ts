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
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  images: string[]
  category_id: string | null
  /** Generic variant map: e.g. { size: ["S","M","L"], color: ["Black","White"] } */
  variants: Record<string, string[]>
  stock: number
  is_active: boolean
  is_featured: boolean
  model_info: string | null
  created_at: string
  /** Populated when joined */
  category?: Category
}

export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled"

export interface CustomerInfo {
  name: string
  phone: string
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
