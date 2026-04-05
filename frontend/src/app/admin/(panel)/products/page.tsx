import Link from "next/link"
import Image from "next/image"
import { serverApi } from "@/lib/serverApi"
import { storeConfig } from "@/config/store.config"
import ProductActiveToggle from "@/components/admin/ProductActiveToggle"
import ProductDeleteButton from "@/components/admin/ProductDeleteButton"
import AdminProductCard from "@/components/admin/AdminProductCard"

export const dynamic = "force-dynamic"

export const metadata = { title: "Products" }

interface Props {
  searchParams: { success?: string }
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const showSuccess = searchParams.success === "true"
  const { currency } = storeConfig.delivery
  const products = await serverApi.products()

  return (
    <div className="max-w-7xl mx-auto">
      {showSuccess && (
        <div className="mb-6 px-4 py-3 text-sm text-white" style={{ backgroundColor: "#10b981" }}>
          Product saved successfully.
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          Products
        </h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 min-h-[44px] flex items-center text-xs uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          + Add Product
        </Link>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {products?.map((product) => (
          <AdminProductCard key={product.id} product={product} />
        ))}
        {(!products || products.length === 0) && (
          <p className="text-center text-gray-400 py-12">
            No products yet.{" "}
            <Link href="/admin/products/new" style={{ color: "var(--color-accent)" }}>
              Add one →
            </Link>
          </p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white border overflow-x-auto" style={{ borderColor: "#e5e7eb" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
              {["", "Name", "Category", "Price", "Stock", "Active", ""].map((h, i) => (
                <th
                  key={i}
                  className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-gray-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <tr
                key={product.id}
                className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                style={{ borderColor: "#e5e7eb" }}
              >
                {/* Thumbnail */}
                <td className="px-4 py-3">
                  <div className="relative w-12 h-16 bg-gray-100 overflow-hidden shrink-0">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[10px]">
                        No img
                      </div>
                    )}
                  </div>
                </td>

                {/* Name */}
                <td className="px-4 py-3 font-medium" style={{ color: "var(--color-primary)" }}>
                  {product.name}
                </td>

                {/* Category */}
                <td className="px-4 py-3 text-gray-500">
                  {product.category?.name ?? "—"}
                </td>

                {/* Price */}
                <td className="px-4 py-3 font-semibold" style={{ color: "var(--color-accent)" }}>
                  {currency} {product.price.toLocaleString()}
                </td>

                {/* Stock */}
                <td className="px-4 py-3 text-gray-500">
                  <span className={product.stock === 0 ? "text-red-500 font-semibold" : ""}>
                    {product.stock}
                  </span>
                </td>

                {/* Active toggle */}
                <td className="px-4 py-3">
                  <ProductActiveToggle
                    productId={product.id}
                    isActive={product.is_active}
                  />
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-xs uppercase tracking-wider font-medium transition-colors hover:opacity-70"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Edit
                    </Link>
                    <ProductDeleteButton productId={product.id} productName={product.name} />
                  </div>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No products yet.{" "}
                  <Link href="/admin/products/new" style={{ color: "var(--color-accent)" }}>
                    Add one →
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
