import Link from "next/link"
import Image from "next/image"
import { serverApi } from "@/lib/serverApi"
import CollectionDeleteButton from "@/components/admin/CollectionDeleteButton"

export const dynamic = "force-dynamic"
export const metadata = { title: "Collections" }

export default async function AdminCollectionsPage() {
  const collections = await serverApi.collections()

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          Collections
        </h1>
        <Link
          href="/admin/collections/new"
          className="flex items-center px-4 min-h-[44px] text-xs uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          + Add Collection
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="bg-white border p-12 text-center" style={{ borderColor: "#e5e7eb" }}>
          <p className="text-gray-400 mb-4">No collections yet.</p>
          <Link
            href="/admin/collections/new"
            className="text-sm font-semibold"
            style={{ color: "var(--color-accent)" }}
          >
            Create your first collection →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {collections.map((col) => (
            <div
              key={col.id}
              className="bg-white border rounded-sm overflow-hidden flex flex-col"
              style={{ borderColor: "#e5e7eb" }}
            >
              {/* Cover image */}
              <div className="relative aspect-video bg-gray-100">
                {col.cover_image ? (
                  <Image
                    src={col.cover_image}
                    alt={col.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-gray-300 text-xs">No cover</span>
                  </div>
                )}
                {/* Active badge */}
                <span
                  className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: col.is_active ? "#10b981" : "#9ca3af" }}
                >
                  {col.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Info */}
              <div className="p-3 flex-1 flex flex-col gap-1">
                <p
                  className="font-semibold text-sm leading-snug"
                  style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}
                >
                  {col.name}
                </p>
                {col.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">{col.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-auto pt-1">
                  {col.product_count} product{col.product_count !== 1 ? "s" : ""}
                  <span className="mx-1">·</span>
                  Order: {col.display_order}
                </p>
              </div>

              {/* Actions */}
              <div className="border-t flex" style={{ borderColor: "#f3f4f6" }}>
                <Link
                  href={`/admin/collections/${col.id}/edit`}
                  className="flex-1 py-2.5 text-center text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-gray-50"
                  style={{ color: "var(--color-primary)" }}
                >
                  Edit
                </Link>
                <div className="w-px bg-gray-100" />
                <CollectionDeleteButton id={col.id} name={col.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
