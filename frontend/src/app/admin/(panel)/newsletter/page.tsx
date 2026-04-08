import { createClient } from "@/lib/supabase/server"
import NewsletterAdminClient from "./NewsletterAdminClient"

export const dynamic = "force-dynamic"

export default async function NewsletterPage() {
  const supabase = await createClient()

  const { data: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false })

  return <NewsletterAdminClient subscribers={subscribers ?? []} />
}
