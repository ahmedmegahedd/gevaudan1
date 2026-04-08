import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product } from "@/types"

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return ""
  const stored = localStorage.getItem("wishlist-session-id")
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem("wishlist-session-id", id)
  return id
}

interface WishlistState {
  items: Product[]
  sessionId: string
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  toggleWishlist: (product: Product) => void
  isInWishlist: (productId: string) => boolean
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: "",

      addToWishlist(product) {
        set((state) => {
          if (state.items.some((p) => p.id === product.id)) return state
          return { items: [...state.items, product] }
        })
      },

      removeFromWishlist(productId) {
        set((state) => ({ items: state.items.filter((p) => p.id !== productId) }))
      },

      toggleWishlist(product) {
        if (get().isInWishlist(product.id)) {
          get().removeFromWishlist(product.id)
        } else {
          get().addToWishlist(product)
        }
      },

      isInWishlist(productId) {
        return get().items.some((p) => p.id === productId)
      },
    }),
    {
      name: "wishlist-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.sessionId = getOrCreateSessionId()
        }
      },
    }
  )
)
