import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product } from "@/types"
import { storeConfig } from "@/config/store.config"
import { getRealVariantKeys, getVariantStock } from "@/lib/variantStock"

export interface CartItem {
  product: Product
  quantity: number
  /** Selected variant values, e.g. { size: "M", color: "Black" } */
  selectedVariants: Record<string, string>
}

interface CartState {
  items: CartItem[]
  addItem: (product: Product, selectedVariants: Record<string, string>, quantity?: number) => void
  removeItem: (productId: string, selectedVariants: Record<string, string>) => void
  updateQuantity: (productId: string, selectedVariants: Record<string, string>, quantity: number) => void
  clearCart: () => void
  subtotal: () => number
  deliveryFee: () => number
  total: () => number
}

/** Two cart items are the same product+variant combination */
function isSameItem(a: CartItem, b: { productId: string; selectedVariants: Record<string, string> }) {
  return (
    a.product.id === b.productId &&
    JSON.stringify(a.selectedVariants) === JSON.stringify(b.selectedVariants)
  )
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(product, selectedVariants, quantity = 1) {
        const realKeys = getRealVariantKeys(product.variants)
        const stock = getVariantStock(product.stock, product.variant_stock, selectedVariants, realKeys)
        set((state) => {
          const existing = state.items.find((i) =>
            isSameItem(i, { productId: product.id, selectedVariants })
          )
          if (existing) {
            const newQty = Math.min(existing.quantity + quantity, stock)
            return {
              items: state.items.map((i) =>
                isSameItem(i, { productId: product.id, selectedVariants })
                  ? { ...i, quantity: newQty }
                  : i
              ),
            }
          }
          const cappedQty = Math.min(quantity, stock)
          return { items: [...state.items, { product, quantity: cappedQty, selectedVariants }] }
        })
      },

      removeItem(productId, selectedVariants) {
        set((state) => ({
          items: state.items.filter(
            (i) => !isSameItem(i, { productId, selectedVariants })
          ),
        }))
      },

      updateQuantity(productId, selectedVariants, quantity) {
        if (quantity <= 0) {
          get().removeItem(productId, selectedVariants)
          return
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (!isSameItem(i, { productId, selectedVariants })) return i
            const realKeys = getRealVariantKeys(i.product.variants)
            const stock = getVariantStock(i.product.stock, i.product.variant_stock, i.selectedVariants, realKeys)
            const capped = Math.min(quantity, stock)
            return { ...i, quantity: capped }
          }),
        }))
      },

      clearCart() {
        set({ items: [] })
      },

      subtotal() {
        return get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
      },

      deliveryFee() {
        const sub = get().subtotal()
        return sub >= storeConfig.delivery.freeAbove ? 0 : storeConfig.delivery.fee
      },

      total() {
        return get().subtotal() + get().deliveryFee()
      },
    }),
    {
      name: "cart-storage",
    }
  )
)
