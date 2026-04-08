import Link from "next/link"
import Image from "next/image"
import { serverApi } from "@/lib/serverApi"
import CategoryDeleteButton from "@/components/admin/CategoryDeleteButton"

export const dynamic = "force-dynamic"
export const metadata = { title: "Categories" }

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([
    serverApi.categories(),
    serverApi.products(),
  ])

  // Count products per category
  const countMap: Record<string, number> = {}
  for (const p of products) {
    if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] ?? 0) + 1
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          Categories
        </h1>
        <Link
          href="/admin/collections/new"
          className="flex items-center px-4 min-h-[44px] text-xs uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          + Add Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
          <p className="text-gray-400 mb-4">No categories yet.</p>
          <Link
            href="/admin/collections/new"
            className="text-sm font-semibold"
            style={{ color: "var(--color-accent)" }}
          >
            Create your first category →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border rounded-sm flex items-center gap-3 px-4 py-3"
              style={{ borderColor: "#e5e7eb" }}
            >
              {/* Thumbnail */}
              <div className="relative w-12 h-12 shrink-0 bg-gray-100 overflow-hidden rounded-sm">
                {cat.image_url ? (
                  <Image src={cat.image_url} alt={cat.name} fill className="object-cover" sizes="48px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[9px]">—</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--color-primary)" }}>
                    {cat.name}
                  </p>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white shrink-0"
                    style={{ backgroundColor: cat.is_active ? "#10b981" : "#9ca3af" }}
                  >
                    {cat.is_active ? "Active" : "Off"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono truncate">{cat.slug}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {countMap[cat.id] ?? 0} product{(countMap[cat.id] ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/collections/${cat.id}/edit`}
                  className="text-xs font-semibold px-3 py-2 border transition-colors hover:bg-gray-50 whitespace-nowrap"
                  style={{ color: "var(--color-primary)", borderColor: "#e5e7eb" }}
                >
                  Edit
                </Link>
                <CategoryDeleteButton id={cat.id} name={cat.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
