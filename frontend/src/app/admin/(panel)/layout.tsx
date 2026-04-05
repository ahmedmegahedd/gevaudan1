import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { storeConfig } from "@/config/store.config"
import AdminSignOutButton from "@/components/admin/AdminSignOutButton"
import AdminNav from "@/components/admin/AdminNav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/admin/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") redirect("/")

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f0f4f8" }}>
      {/* Admin header */}
      <header
        className="h-14 flex items-center justify-between px-6 border-b"
        style={{ backgroundColor: "var(--color-primary)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-6">
          <div className="flex flex-col leading-none mr-2">
            <span
              className="text-base font-bold tracking-wider text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {storeConfig.brand.name}
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--color-accent)" }}>
              Admin
            </span>
          </div>

          <AdminNav />
        </div>

        <AdminSignOutButton />
      </header>

      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
