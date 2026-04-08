"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { storeConfig } from "@/config/store.config"
import { useCartStore } from "@/store/cartStore"
import { useToastStore } from "@/store/toastStore"
import type { Product } from "@/types"

const { currency } = storeConfig.delivery

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function CheckoutRecommendations() {
  const cartItems = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (cartItems.length === 0) return

    const excludeIds = cartItems.map((i) => i.product.id)
    // Use the most common category in the cart
    const categoryCounts: Record<string, number> = {}
    for (const item of cartItems) {
      if (item.product.category_id) {
        categoryCounts[item.product.category_id] =
          (categoryCounts[item.product.category_id] ?? 0) + 1
      }
    }
    const topCategory =
      Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    async function fetch() {
      const supabase = createClient()
      const candidates: Product[] = []

      if (topCategory) {
        const { data } = await supabase
          .from("products")
          .select("*, category:categories(*)")
          .eq("is_active", true)
          .eq("category_id", topCategory)
          .not("id", "in", `(${excludeIds.join(",")})`)
          .limit(16)
        if (data) candidates.push(...(data as Product[]))
      }

      if (candidates.length < 4) {
        const existingIds = [...excludeIds, ...candidates.map((p) => p.id)]
        const { data } = await supabase
          .from("products")
          .select("*, category:categories(*)")
          .eq("is_active", true)
          .eq("is_featured", true)
          .not("id", "in", `(${existingIds.join(",")})`)
          .limit(12)
        if (data) candidates.push(...(data as Product[]))
      }

      setProducts(shuffle(candidates).slice(0, 4))
    }

    fetch()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (products.length === 0) return null

  return (
    <div className="mb-8 border rounded" style={{ borderColor: "#e5e7eb" }}>
      {/* Collapsible header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span
          className="text-base font-semibold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          Complete Your Look
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 transition-transform duration-300 shrink-0"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--color-accent)",
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Animated body */}
      <div
        style={{
          maxHeight: open ? "600px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.35s ease",
        }}
      >
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-px border-t"
          style={{ borderColor: "#e5e7eb", backgroundColor: "#e5e7eb" }}
        >
          {products.map((product) => (
            <RecoCard key={product.id} product={product} onAdd={() => {
              const defaultVariants: Record<string, string> = {}
              for (const [key, values] of Object.entries(product.variants)) {
                if (values.length > 0) defaultVariants[key] = values[0]
              }
              addItem(product, defaultVariants, 1)
              useToastStore.getState().addToast("Added to cart", "success")
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function RecoCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const mainImage = product.images[0] ?? null

  return (
    <div className="bg-white flex flex-col">
      <Link href={`/shop/${product.slug}`} className="relative aspect-[3/4] block overflow-hidden bg-gray-50">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-300 text-xs">No image</span>
          </div>
        )}
      </Link>

      <div className="px-3 pt-2 pb-3 flex flex-col gap-1 flex-1">
        <Link href={`/shop/${product.slug}`}>
          <p
            className="text-sm font-medium leading-snug line-clamp-2"
            style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
          >
            {product.name}
          </p>
        </Link>
        <p className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
          {currency} {product.price.toLocaleString()}
        </p>
        <button
          onClick={onAdd}
          className="mt-auto w-full py-2 text-xs uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}
