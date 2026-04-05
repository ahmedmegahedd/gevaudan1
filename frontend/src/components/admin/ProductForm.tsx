"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import { clientApi } from "@/lib/clientApi"
import { storeConfig } from "@/config/store.config"
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/constants"
import { useToastStore } from "@/store/toastStore"
import type { Category, Product } from "@/types"

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  description: z.string().optional(),
  price: z.preprocess((v) => Number(v), z.number().min(0)),
  category_id: z.string().optional(),
  stock: z.preprocess((v) => Number(v), z.number().int().min(0)),
  is_active: z.boolean(),
  is_featured: z.boolean(),
})

type FormValues = {
  name: string
  slug: string
  description?: string
  price: number
  category_id?: string
  stock: number
  is_active: boolean
  is_featured: boolean
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ImageEntry =
  | { type: "existing"; url: string }
  | { type: "new"; file: File; preview: string }

interface VariantGroup {
  key: string   // e.g. "Size"
  value: string // comma-separated, e.g. "S, M, L, XL"
}

export interface ProductFormProps {
  categories: Category[]
  initialData?: Product
  mode: "create" | "edit"
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function parseVariants(variants: Record<string, string[]>): VariantGroup[] {
  return Object.entries(variants).map(([key, vals]) => ({
    key,
    value: vals.join(", "),
  }))
}

function buildVariants(groups: VariantGroup[]): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const g of groups) {
    const key = g.key.trim()
    if (!key) continue
    result[key] = g.value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return result
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProductForm({ categories, initialData, mode }: ProductFormProps) {
  const router = useRouter()
  const { currency } = storeConfig.delivery

  // Slug auto-generation: track whether the slug was manually edited
  const [slugManual, setSlugManual] = useState(mode === "edit")

  // Variant groups state
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>(
    initialData ? parseVariants(initialData.variants) : []
  )

  // Images state: mix of existing URLs and new local files
  const [images, setImages] = useState<ImageEntry[]>(
    initialData
      ? initialData.images.map((url) => ({ type: "existing", url }))
      : []
  )
  const [imageError, setImageError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // ── Form setup ──
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price ?? 0,
      category_id: initialData?.category_id ?? "",
      stock: initialData?.stock ?? 0,
      is_active: initialData?.is_active ?? true,
      is_featured: initialData?.is_featured ?? false,
    },
  })

  const nameValue = watch("name")
  const slugValue = watch("slug")
  const isActive = watch("is_active")
  const isFeatured = watch("is_featured")

  // Auto-generate slug from name (unless manually overridden)
  useEffect(() => {
    if (!slugManual && nameValue) {
      setValue("slug", slugify(nameValue), { shouldValidate: true })
    }
  }, [nameValue, slugManual, setValue])

  // ── Image handling ──

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError(null)
    const files = Array.from(e.target.files ?? [])
    const remaining = 5 - images.length
    if (files.length > remaining) {
      setImageError(`You can upload up to 5 images total. ${remaining} slot(s) remaining.`)
      return
    }
    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setImageError("Only JPG, PNG, and WebP images are accepted.")
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setImageError("Each image must be under 5 MB.")
        return
      }
    }
    const newEntries: ImageEntry[] = files.map((file) => ({
      type: "new",
      file,
      preview: URL.createObjectURL(file),
    }))
    setImages((prev) => [...prev, ...newEntries])
    e.target.value = "" // reset input so same file can be re-selected
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const entry = prev[index]
      if (entry.type === "new") URL.revokeObjectURL(entry.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  function moveImage(from: number, to: number) {
    setImages((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  async function uploadNewImages(): Promise<string[]> {
    const results: string[] = []
    for (const entry of images) {
      if (entry.type === "existing") {
        results.push(entry.url)
      } else {
        const { data, error } = await clientApi.uploadImage(entry.file)
        if (error || !data) throw new Error(error ?? "Upload failed")
        results.push(data.url)
      }
    }
    return results
  }

  // ── Variant handlers ──

  function addVariantGroup() {
    setVariantGroups((prev) => [...prev, { key: "", value: "" }])
  }

  function updateVariantKey(index: number, key: string) {
    setVariantGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, key } : g))
    )
  }

  function updateVariantValue(index: number, value: string) {
    setVariantGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, value } : g))
    )
  }

  function removeVariantGroup(index: number) {
    setVariantGroups((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Submit ──

  async function onSubmit(values: FormValues) {
    setImageError(null)
    setUploading(true)

    let imageUrls: string[]
    try {
      imageUrls = await uploadNewImages()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Image upload failed."
      setImageError(message)
      useToastStore.getState().addToast(message, "error")
      setUploading(false)
      return
    }

    setUploading(false)
    const variants = buildVariants(variantGroups)

    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description ?? null,
      price: values.price,
      category_id: values.category_id || null,
      stock: values.stock,
      is_active: values.is_active,
      is_featured: values.is_featured,
      variants,
      images: imageUrls,
    }

    if (mode === "create") {
      const { error } = await clientApi.createProduct(payload)
      if (error) {
        setImageError(error)
        useToastStore.getState().addToast(error, "error")
        return
      }
    } else {
      const { error } = await clientApi.updateProduct(initialData!.id, payload)
      if (error) {
        setImageError(error)
        useToastStore.getState().addToast(error, "error")
        return
      }
    }

    useToastStore.getState().addToast("Product saved successfully", "success")
    router.push("/admin/products?success=true")
    router.refresh()
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const saving = isSubmitting || uploading

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">

      {/* ── Name + Slug ── */}
      <Section title="Basic Info">
        <Field label="Product Name" error={errors.name?.message}>
          <input
            {...register("name")}
            type="text"
            placeholder="e.g. Silk Evening Dress"
            className={input(!!errors.name)}
          />
        </Field>

        <Field label="Slug (URL-safe identifier)" error={errors.slug?.message}>
          <input
            {...register("slug")}
            type="text"
            placeholder="silk-evening-dress"
            className={input(!!errors.slug)}
            onChange={(e) => {
              setSlugManual(true)
              setValue("slug", e.target.value, { shouldValidate: true })
            }}
          />
          {slugValue && (
            <p className="text-xs text-gray-400 mt-1">
              Preview: <span className="font-mono">/shop/{slugValue}</span>
              {!slugManual && (
                <button
                  type="button"
                  className="ml-3 text-gray-400 underline"
                  onClick={() => setSlugManual(true)}
                >
                  Edit manually
                </button>
              )}
            </p>
          )}
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Describe the product…"
            className={input(false)}
          />
        </Field>
      </Section>

      {/* ── Pricing & Inventory ── */}
      <Section title="Pricing & Inventory">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={`Price (${currency})`} error={errors.price?.message}>
            <input
              {...register("price")}
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              className={input(!!errors.price)}
            />
          </Field>

          <Field label="Stock" error={errors.stock?.message}>
            <input
              {...register("stock")}
              type="number"
              min={0}
              step={1}
              placeholder="0"
              className={input(!!errors.stock)}
            />
          </Field>
        </div>
      </Section>

      {/* ── Category ── */}
      <Section title="Category">
        <Field label="Category" error={undefined}>
          <select {...register("category_id")} className={input(false)}>
            <option value="">— No category —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* ── Variants ── */}
      <Section title="Variants">
        <p className="text-xs text-gray-400 mb-4">
          Add variant groups (e.g. &quot;Size&quot;, &quot;Color&quot;). Options are comma-separated.
          Saves as JSON — works for any product type without code changes.
        </p>

        <div className="space-y-3">
          {variantGroups.map((group, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="w-full sm:w-32 shrink-0">
                <input
                  type="text"
                  value={group.key}
                  onChange={(e) => updateVariantKey(i, e.target.value)}
                  placeholder="Group name"
                  className={`${input(false)} text-sm`}
                />
              </div>
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={group.value}
                  onChange={(e) => updateVariantValue(i, e.target.value)}
                  placeholder="S, M, L, XL"
                  className={`${input(false)} text-sm`}
                />
                {group.value && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {group.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean)
                      .map((v) => (
                        <span
                          key={v}
                          className="text-[10px] px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: "var(--color-accent)" }}
                        >
                          {v}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeVariantGroup(i)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                aria-label="Remove variant group"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addVariantGroup}
          className="mt-4 text-xs uppercase tracking-wider font-medium border px-4 py-2 min-h-[44px] transition-colors hover:bg-gray-50"
          style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
        >
          + Add Variant Group
        </button>
      </Section>

      {/* ── Images ── */}
      <Section title="Images">
        <p className="text-xs text-gray-400 mb-4">
          Up to 5 images. First image is the main image. Drag to reorder (use ← → buttons).
          Accepted: JPG, PNG, WebP. Max 5 MB each.
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          {images.map((entry, i) => {
            const src = entry.type === "existing" ? entry.url : entry.preview
            return (
              <div key={i} className="relative group w-24 aspect-[3/4] bg-gray-100 overflow-hidden border" style={{ borderColor: "#e5e7eb" }}>
                <Image src={src} alt={`Image ${i + 1}`} fill className="object-cover" sizes="96px" />

                {/* Badge */}
                {i === 0 && (
                  <span className="absolute top-1 left-1 text-[9px] uppercase tracking-wider font-bold text-white px-1.5 py-0.5"
                    style={{ backgroundColor: "var(--color-accent)" }}>
                    Main
                  </span>
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveImage(i, i - 1)} disabled={i === 0}
                      className="text-white text-xs bg-white/20 hover:bg-white/40 px-1.5 py-0.5 rounded disabled:opacity-30">
                      ←
                    </button>
                    <button type="button" onClick={() => moveImage(i, i + 1)} disabled={i === images.length - 1}
                      className="text-white text-xs bg-white/20 hover:bg-white/40 px-1.5 py-0.5 rounded disabled:opacity-30">
                      →
                    </button>
                  </div>
                  <button type="button" onClick={() => removeImage(i)}
                    className="text-white text-xs bg-red-500/80 hover:bg-red-500 px-2 py-0.5 rounded">
                    Remove
                  </button>
                </div>
              </div>
            )
          })}

          {/* Add image slot */}
          {images.length < 5 && (
            <label className="w-24 aspect-[3/4] border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
              style={{ borderColor: "#d1d5db" }}>
              <span className="text-gray-300 text-3xl leading-none select-none">+</span>
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          )}
        </div>

        {imageError && <p className="text-xs text-red-500">{imageError}</p>}
      </Section>

      {/* ── Visibility ── */}
      <Section title="Visibility">
        <div className="space-y-4">
          <ToggleField
            label="Active"
            description="Visible to customers in the shop"
            checked={isActive}
            onChange={(v) => setValue("is_active", v)}
          />
          <ToggleField
            label="Featured"
            description="Shown in the Featured section on the homepage"
            checked={isFeatured}
            onChange={(v) => setValue("is_featured", v)}
          />
        </div>
      </Section>

      {/* ── Submit ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-8 text-sm uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--color-primary)", minHeight: "48px" }}
        >
          {saving
            ? uploading
              ? "Uploading images…"
              : "Saving…"
            : mode === "create"
              ? "Create Product"
              : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="flex items-center justify-center min-h-[44px] px-4 text-sm text-gray-400 hover:text-gray-600 transition-colors border border-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border p-4 sm:p-6 space-y-4" style={{ borderColor: "#e5e7eb" }}>
      <h2
        className="text-xs uppercase tracking-widest font-semibold text-gray-400 border-b pb-3"
        style={{ borderColor: "#f3f4f6" }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium" style={{ color: "var(--color-primary)" }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
          {label}
        </p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
        style={{ backgroundColor: checked ? "var(--color-accent)" : "#d1d5db" }}
        aria-checked={checked}
        role="switch"
      >
        <span
          className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
        />
      </button>
    </div>
  )
}

function input(hasError: boolean) {
  return [
    "w-full border px-3 text-base focus:outline-none transition-colors bg-white",
    hasError
      ? "border-red-400"
      : "border-gray-300 focus:border-gray-600",
  ].join(" ") + " min-h-[48px]"
}
