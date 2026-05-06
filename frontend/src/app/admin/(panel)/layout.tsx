import { storeConfig } from "@/config/store.config"
import AdminSignOutButton from "@/components/admin/AdminSignOutButton"
import AdminNav from "@/components/admin/AdminNav"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Auth + role checks are handled entirely in middleware (matcher: /admin/:path*)
// By the time this layout renders, the request is already verified as an admin.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { count: pendingReturns } = await supabase
    .from("return_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#EFE6D6" }}>
      {/* Admin header */}
      <header
        className="h-14 flex items-center justify-between px-4 sm:px-6 border-b"
        style={{ backgroundColor: "var(--color-primary)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex flex-col leading-none mr-2">
            <span
              className="brand-script text-white"
              style={{ fontSize: 22 }}
            >
              {storeConfig.brand.name}
            </span>
            <span
              className="text-[9px] uppercase tracking-[0.3em] mt-0.5"
              style={{ color: "var(--color-cream)" }}
            >
              Admin
            </span>
          </div>

          <AdminNav pendingReturns={pendingReturns ?? 0} />
        </div>

        <AdminSignOutButton />
      </header>

      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
