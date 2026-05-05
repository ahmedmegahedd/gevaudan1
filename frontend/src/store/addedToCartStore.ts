import { create } from "zustand"
import type { Product } from "@/types"

/**
 * State for the "Just Added to Cart" mini-popup.
 * Separate from the generic toast store because the payload (product + variants
 * + quantity) is richer and the UI is its own component.
 */

export interface AddedItem {
  product: Product
  variants: Record<string, string>
  quantity: number
  /** Render key — bumping it on each `show()` retriggers the slide-in animation. */
  key: number
}

interface AddedToCartState {
  current: AddedItem | null
  show: (product: Product, variants: Record<string, string>, quantity: number) => void
  hide: () => void
}

export const useAddedToCartStore = create<AddedToCartState>((set) => ({
  current: null,
  show: (product, variants, quantity) =>
    set({ current: { product, variants, quantity, key: Date.now() } }),
  hide: () => set({ current: null }),
}))
