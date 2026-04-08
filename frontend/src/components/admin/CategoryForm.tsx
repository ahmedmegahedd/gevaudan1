"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { clientApi } from "@/lib/clientApi"
import { useToastStore } from "@/store/toastStore"
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants"
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
  const [uploading, setUploading] = useState(false)

  // Image state
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.image_url ?? null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  useEffect(() => {
    if (!slugManual && name) setSlug(slugify(name))
  }, [name, slugManual])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Only JPG, PNG, or WebP accepted.")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setImageError("Image must be under 5 MB.")
      return
    }
    setImageError(null)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ""
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    setImageUrl(null)
  }

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

    let finalImageUrl = imageUrl
    if (imageFile) {
      setUploading(true)
      const { data, error } = await clientApi.uploadImage(imageFile)
      setUploading(false)
      if (error || !data) {
        setImageError(error ?? "Upload failed")
        setSaving(false)
        return
      }
      finalImageUrl = data.url
    }

    const payload = { name: name.trim(), slug: slug.trim(), is_active: isActive, image_url: finalImageUrl }

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

  const currentImage = imagePreview ?? imageUrl
  const isSaving = saving || uploading

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

        {/* Cover image */}
        <div className="space-y-1">
          <label className="block text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            Category Image
          </label>
          {currentImage ? (
            <div className="relative w-full max-w-xs aspect-video overflow-hidden bg-gray-100 group">
              <Image src={currentImage} alt="Category cover" fill className="object-cover" sizes="320px" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="text-xs text-white bg-white/20 hover:bg-white/40 px-3 py-1.5 rounded cursor-pointer">
                  Change
                  <input type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={handleImageSelect} />
                </label>
                <button type="button" onClick={removeImage} className="text-xs text-white bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center w-full max-w-xs aspect-video border-2 border-dashed cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
              style={{ borderColor: "#d1d5db" }}
            >
              <span className="text-gray-300 text-3xl mb-1">+</span>
              <span className="text-xs text-gray-400">Upload category image</span>
              <input type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={handleImageSelect} />
            </label>
          )}
          {imageError && <p className="text-xs text-red-500">{imageError}</p>}
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
          disabled={isSaving}
          className="px-8 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--color-primary)", minHeight: "48px" }}
        >
          {uploading ? "Uploading…" : saving ? "Saving…" : mode === "create" ? "Create Category" : "Save Changes"}
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
