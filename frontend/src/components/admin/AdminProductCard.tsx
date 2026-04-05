"use client"

import Image from "next/image"
import Link from "next/link"
import { storeConfig } from "@/config/store.config"
import ProductActiveToggle from "./ProductActiveToggle"
import ProductDeleteButton from "./ProductDeleteButton"
import type { Product } from "@/types"

type ProductWithCategory = Product & { category: { name: string } | null }

interface Props {
  product: ProductWithCategory
}

export default function AdminProductCard({ product }: Props) {
  const { currency } = storeConfig.delivery
  return (
    <div className="bg-white border p-4 flex gap-3 items-start" style={{ borderColor: "#e5e7eb" }}>
      {/* Thumbnail */}
      <div className="relative w-16 h-20 shrink-0 bg-gray-100 overflow-hidden">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[10px]">
            No img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: "var(--color-primary)" }}>
          {product.name}
        </p>
        <p className="text-xs text-gray-400">{product.category?.name ?? "—"}</p>
        <p className="text-sm font-semibold mt-1" style={{ color: "var(--color-accent)" }}>
          {currency} {product.price.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400">
          Stock:{" "}
          <span className={product.stock === 0 ? "text-red-500 font-semibold" : ""}>
            {product.stock}
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <ProductActiveToggle productId={product.id} isActive={product.is_active} />
        <div className="flex gap-3">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="text-xs font-medium"
            style={{ color: "var(--color-primary)" }}
          >
            Edit
          </Link>
          <ProductDeleteButton productId={product.id} productName={product.name} />
        </div>
      </div>
    </div>
  )
}
