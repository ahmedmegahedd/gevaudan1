import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === "/admin/login"

  // Build a Supabase client that can refresh the session cookie
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session (required by Supabase SSR)
  const { data: { user } } = await supabase.auth.getUser()

  if (!isLoginPage) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    // Check admin role and pass it to the layout via a request header
    // so the layout doesn't need its own DB query
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Stamp the verified role on the request so the layout can read it
    response.headers.set("x-admin-verified", "1")
  }

  // Redirect logged-in admin away from login page
  if (isLoginPage && user) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return response
}

export const config = {
  // Only run middleware on /admin routes — shop pages need no auth check
  matcher: ["/admin/:path*"],
}
