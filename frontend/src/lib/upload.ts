import { createClient } from "@/lib/supabase/client"
import { STORAGE_BUCKET } from "@/lib/constants"

/**
 * Uploads a File to Supabase Storage and returns its public URL.
 * Uses a UUID-based filename to avoid collisions.
 */
export async function uploadImage(file: File): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split(".").pop()
  const filename = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, file, { upsert: false })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename)
  return data.publicUrl
}
