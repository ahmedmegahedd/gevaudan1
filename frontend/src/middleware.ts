import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const isLoginPage = request.nextUrl.pathname === "/admin/login"

  // Protect /admin/* routes (but not the login page itself)
  if (request.nextUrl.pathname.startsWith("/admin") && !isLoginPage) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // Redirect authenticated admin away from login page
  if (isLoginPage && user) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
