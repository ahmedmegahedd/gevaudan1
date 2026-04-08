import Link from "next/link"
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
        <div className="border rounded-sm overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <div
            className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 text-xs uppercase tracking-wider text-gray-400 border-b"
            style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
          >
            <span>Name</span>
            <span className="text-center">Products</span>
            <span className="text-center">Status</span>
            <span />
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3 border-b last:border-0"
              style={{ borderColor: "#f3f4f6" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
                  {cat.name}
                </p>
                <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
              </div>
              <span className="text-sm text-gray-500 text-center w-16">
                {countMap[cat.id] ?? 0}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white w-16 text-center"
                style={{ backgroundColor: cat.is_active ? "#10b981" : "#9ca3af" }}
              >
                {cat.is_active ? "Active" : "Off"}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/collections/${cat.id}/edit`}
                  className="text-xs font-semibold px-3 py-1.5 border transition-colors hover:bg-gray-50"
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
