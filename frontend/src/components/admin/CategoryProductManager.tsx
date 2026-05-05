"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { clientApi } from "@/lib/clientApi"
import { useToastStore } from "@/store/toastStore"
import { storeConfig } from "@/config/store.config"
import type { Product } from "@/types"

interface Props {
  categoryId: string
  categoryProducts: Product[]
  otherProducts: Product[]
}

export default function CategoryProductManager({ categoryId, categoryProducts, otherProducts }: Props) {
  const { currency } = storeConfig.delivery
  const router = useRouter()

  const [assigned, setAssigned] = useState<Product[]>(categoryProducts)
  const [unassigned, setUnassigned] = useState<Product[]>(otherProducts)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")

  const filteredUnassigned = useMemo(() => {
    const q = search.toLowerCase()
    return unassigned.filter((p) => p.name.toLowerCase().includes(q))
  }, [unassigned, search])

  function setBusy(id: string, v: boolean) {
    setBusyIds((prev) => {
      const s = new Set(prev)
      if (v) s.add(id); else s.delete(id)
      return s
    })
  }

  async function handleAdd(product: Product) {
    setBusy(product.id, true)
    const { error } = await clientApi.setProductCategory(product.id, categoryId)
    setBusy(product.id, false)
    if (error) { useToastStore.getState().addToast("Failed to add product", "error"); return }
    setAssigned((prev) => [...prev, product])
    setUnassigned((prev) => prev.filter((p) => p.id !== product.id))
    router.refresh()
  }

  async function handleRemove(product: Product) {
    setBusy(product.id, true)
    const { error } = await clientApi.setProductCategory(product.id, null)
    setBusy(product.id, false)
    if (error) { useToastStore.getState().addToast("Failed to remove product", "error"); return }
    setUnassigned((prev) => [...prev, product])
    setAssigned((prev) => prev.filter((p) => p.id !== product.id))
    router.refresh()
  }

  return (
    <div className="border rounded-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      <div
        className="px-4 sm:px-6 py-3 border-b text-xs font-semibold uppercase tracking-wider text-gray-400"
        style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
      >
        Products in this Category ({assigned.length})
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Left: add products */}
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
            {filteredUnassigned.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 px-4">
                {search ? "No products match your search." : "All products are in this category."}
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {filteredUnassigned.map((product) => {
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
                        <p className="text-sm font-medium truncate" style={{ color: "var(--color-primary)" }}>{product.name}</p>
                        <p className="text-xs text-gray-400">{currency} {product.price.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleAdd(product)}
                        disabled={busy}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: "var(--color-accent)" }}
                        title="Add to category"
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

        {/* Right: products in this category */}
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b" style={{ borderColor: "#f3f4f6" }}>
            <p className="text-xs font-semibold text-gray-500">In this Category</p>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
            {assigned.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 px-4">
                No products yet. Add from the left.
              </p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {assigned.map((product) => {
                  const busy = busyIds.has(product.id)
                  return (
                    <li key={product.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="relative w-10 h-14 shrink-0 bg-gray-100 overflow-hidden rounded-sm">
                        {product.images[0] ? (
                          <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[9px]">—</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--color-primary)" }}>{product.name}</p>
                        <p className="text-xs text-gray-400">{currency} {product.price.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(product)}
                        disabled={busy}
                        className="shrink-0 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40 text-lg leading-none"
                        title="Remove from category"
                      >
                        {busy ? "…" : "×"}
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
