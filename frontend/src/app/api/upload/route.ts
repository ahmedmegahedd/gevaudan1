import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { STORAGE_BUCKET, MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from "@/lib/constants"

/**
 * POST /api/upload
 * Body: FormData with field "file"
 * Returns: { url: string } | { error: string }
 *
 * Uses the service role key so RLS does not block storage writes.
 * Only reachable by authenticated admin (enforced in middleware).
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file")

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type. Accepted: ${ACCEPTED_IMAGE_TYPES.join(", ")}` },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024} MB` },
      { status: 400 }
    )
  }

  // Use service role for storage — bypasses RLS
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const ext = file.name.split(".").pop()
  const filename = `${crypto.randomUUID()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, bytes, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename)
  return NextResponse.json({ url: data.publicUrl })
}
