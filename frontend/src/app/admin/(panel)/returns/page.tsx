import { createClient } from "@/lib/supabase/server"
import ReturnsAdminClient from "./ReturnsAdminClient"
import type { ReturnRequest } from "@/types"

export const dynamic = "force-dynamic"

export const metadata = { title: "Returns & Exchanges" }

export default async function AdminReturnsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("return_requests")
    .select("*")
    .order("created_at", { ascending: false })

  return <ReturnsAdminClient requests={(data as ReturnRequest[]) ?? []} />
}
