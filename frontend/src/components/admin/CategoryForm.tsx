"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { clientApi } from "@/lib/clientApi"
import { useToastStore } from "@/store/toastStore"
import type { Category } from "@/types"

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function inputCls(hasError: boolean) {
  return [
    "w-full border px-3 text-base focus:outline-none transition-colors bg-white min-h-[48px]",
    hasError ? "border-red-400" : "border-gray-300 focus:border-[var(--color-accent)]",
  ].join(" ")
}

export interface CategoryFormProps {
  initialData?: Category
  mode: "create" | "edit"
}

export default function CategoryForm({ initialData, mode }: CategoryFormProps) {
  const router = useRouter()

  const [name, setName] = useState(initialData?.name ?? "")
  const [slug, setSlug] = useState(initialData?.slug ?? "")
  const [slugManual, setSlugManual] = useState(mode === "edit")
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!slugManual && name) setSlug(slugify(name))
  }, [name, slugManual])

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Name is required"
    if (!slug.trim()) errs.slug = "Slug is required"
    if (!/^[a-z0-9-]+$/.test(slug)) errs.slug = "Slug: lowercase, numbers, hyphens only"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    const payload = { name: name.trim(), slug: slug.trim(), is_active: isActive }

    if (mode === "create") {
      const { data, error } = await clientApi.createCategory(payload)
      setSaving(false)
      if (error) {
        const isDup = error.includes("duplicate") || error.includes("unique")
        setErrors({ slug: isDup ? "This slug is already taken." : error })
        useToastStore.getState().addToast(error, "error")
        return
      }
      useToastStore.getState().addToast("Category created", "success")
      router.push(`/admin/collections/${data!.id}/edit`)
    } else {
      const { error } = await clientApi.updateCategory(initialData!.id, payload)
      setSaving(false)
      if (error) {
        const isDup = error.includes("duplicate") || error.includes("unique")
        setErrors({ slug: isDup ? "This slug is already taken." : error })
        useToastStore.getState().addToast(error, "error")
        return
      }
      useToastStore.getState().addToast("Category saved", "success")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border p-4 sm:p-6 space-y-4" style={{ borderColor: "#e5e7eb" }}>
        <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 border-b pb-3" style={{ borderColor: "#f3f4f6" }}>
          Category Info
        </h2>

        <div className="space-y-1">
          <label className="block text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            Category Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="e.g. Dresses"
            className={inputCls(!!errors.name)}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            Slug (URL identifier)
          </label>
          <input
            value={slug}
            onChange={(e) => { setSlugManual(true); setSlug(e.target.value) }}
            type="text"
            placeholder="dresses"
            className={inputCls(!!errors.slug)}
          />
          {slug && (
            <p className="text-xs text-gray-400 mt-1">
              Preview: <span className="font-mono">/shop?category={slug}</span>
            </p>
          )}
          {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>Active</p>
            <p className="text-xs text-gray-400">Visible in shop filters</p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ backgroundColor: isActive ? "var(--color-accent)" : "#d1d5db" }}
            role="switch"
            aria-checked={isActive}
          >
            <span
              className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: isActive ? "translateX(22px)" : "translateX(2px)" }}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-8 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--color-primary)", minHeight: "48px" }}
        >
          {saving ? "Saving…" : mode === "create" ? "Create Category" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/collections")}
          className="flex items-center justify-center min-h-[44px] px-4 text-sm text-gray-400 hover:text-gray-600 transition-colors border border-gray-200"
        >
          Cancel
        </button>
      </div>

      {mode === "create" && (
        <p className="text-xs text-gray-400">
          After creating the category you&apos;ll be able to assign products to it.
        </p>
      )}
    </form>
  )
}
