"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { clientApi } from "@/lib/clientApi"
import { useToastStore } from "@/store/toastStore"
import { storeConfig } from "@/config/store.config"
import type { CollectionProduct, Product, Category } from "@/types"

type ProductWithCategory = Product & { category?: Category }

interface AssignedProduct {
  product_id: string
  display_order: number
  product: ProductWithCategory
}

interface Props {
  collectionId: string
  allProducts: ProductWithCategory[]
  initialAssigned: CollectionProduct[]
}

export default function CollectionProductAssigner({
  collectionId,
  allProducts,
  initialAssigned,
}: Props) {
  const { currency } = storeConfig.delivery

  const [assigned, setAssigned] = useState<AssignedProduct[]>(
    initialAssigned
      .filter((cp) => cp.product)
      .sort((a, b) => a.display_order - b.display_order)
      .map((cp) => ({
        product_id: cp.product_id,
        display_order: cp.display_order,
        product: cp.product as ProductWithCategory,
      }))
  )

  const [search, setSearch] = useState("")
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())

  const assignedIds = useMemo(() => new Set(assigned.map((a) => a.product_id)), [assigned])

  const available = useMemo(() => {
    const q = search.toLowerCase()
    return allProducts.filter(
      (p) => !assignedIds.has(p.id) && p.name.toLowerCase().includes(q)
    )
  }, [allProducts, assignedIds, search])

  function setBusy(id: string, busy: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev)
      if (busy) { next.add(id) } else { next.delete(id) }
      return next
    })
  }

  async function handleAdd(product: ProductWithCategory) {
    setBusy(product.id, true)
    const nextOrder = assigned.length > 0
      ? Math.max(...assigned.map((a) => a.display_order)) + 1
      : 0
    const { error } = await clientApi.addProductToCollection(collectionId, product.id, nextOrder)
    setBusy(product.id, false)
    if (error) {
      useToastStore.getState().addToast("Failed to add product", "error")
      return
    }
    setAssigned((prev) => [
      ...prev,
      { product_id: product.id, display_order: nextOrder, product },
    ])
  }

  async function handleRemove(productId: string) {
    setBusy(productId, true)
    const { error } = await clientApi.removeProductFromCollection(collectionId, productId)
    setBusy(productId, false)
    if (error) {
      useToastStore.getState().addToast("Failed to remove product", "error")
      return
    }
    setAssigned((prev) => prev.filter((a) => a.product_id !== productId))
  }

  async function handleMove(index: number, dir: -1 | 1) {
    const next = [...assigned]
    const swapIdx = index + dir
    if (swapIdx < 0 || swapIdx >= next.length) return

    // Swap display_orders
    const aOrder = next[index].display_order
    const bOrder = next[swapIdx].display_order
    next[index] = { ...next[index], display_order: bOrder }
    next[swapIdx] = { ...next[swapIdx], display_order: aOrder }
    next.sort((a, b) => a.display_order - b.display_order)
    setAssigned(next)

    // Persist both
    await Promise.all([
      clientApi.updateCollectionProductOrder(collectionId, next[index].product_id, next[index].display_order),
      clientApi.updateCollectionProductOrder(collectionId, next[swapIdx].product_id, next[swapIdx].display_order),
    ])
  }

  return (
    <div className="bg-white border rounded-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      <div
        className="px-4 sm:px-6 py-3 border-b text-xs font-semibold uppercase tracking-wider text-gray-400"
        style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
      >
        Products in this Collection ({assigned.length})
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* ── Left: Available products ── */}
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b" style={{ borderColor: "#f3f4f6" }}>
            <p className="text-xs font-semibold text-gray-500 mb-2">Add Products</p>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full border text-sm px-3 py-2 focus:outline-none focus:border-[var(--color-accent)] bg-white"
              style={{ borderColor: "#e5e7eb" }}
            />
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
            {available.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 px-4">
                {search ? "No products match your search." : "All products are already in this collection."}
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {available.map((product) => {
                  const busy = busyIds.has(product.id)
                  return (
                    <li key={product.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                      <div className="relative w-10 h-14 shrink-0 bg-gray-100 overflow-hidden rounded-sm">
                        {product.images[0] ? (
                          <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[9px]">—</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--color-primary)" }}>
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-400">{currency} {product.price.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleAdd(product)}
                        disabled={busy}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: "var(--color-accent)" }}
                        title="Add to collection"
                      >
                        {busy ? "…" : "+"}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Right: Assigned products ── */}
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b" style={{ borderColor: "#f3f4f6" }}>
            <p className="text-xs font-semibold text-gray-500">In Collection — ordered top to bottom</p>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
            {assigned.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 px-4">
                No products yet. Add from the left.
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {assigned.map((item, index) => {
                  const busy = busyIds.has(item.product_id)
                  return (
                    <li key={item.product_id} className="flex items-center gap-3 px-4 py-2.5">
                      {/* Order buttons */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          onClick={() => handleMove(index, -1)}
                          disabled={index === 0}
                          className="w-6 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors text-xs"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMove(index, 1)}
                          disabled={index === assigned.length - 1}
                          className="w-6 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors text-xs"
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="relative w-10 h-14 shrink-0 bg-gray-100 overflow-hidden rounded-sm">
                        {item.product.images[0] ? (
                          <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[9px]">—</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--color-primary)" }}>
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-400">{currency} {item.product.price.toLocaleString()}</p>
                      </div>

                      <span className="text-xs text-gray-300 shrink-0 font-mono w-5 text-center">
                        {index + 1}
                      </span>

                      <button
                        onClick={() => handleRemove(item.product_id)}
                        disabled={busy}
                        className="shrink-0 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40 text-lg leading-none"
                        title="Remove from collection"
                      >
                        ×
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
