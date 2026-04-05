"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AdminSignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs uppercase tracking-wider text-white/50 hover:text-white transition-colors"
    >
      Sign Out
    </button>
  )
}
