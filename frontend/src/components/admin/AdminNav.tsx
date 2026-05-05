"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavLink {
  label: string
  href: string
  /** When set, renders a numeric badge next to the label. */
  badge?: number
}

interface AdminNavProps {
  pendingReturns?: number
}

export default function AdminNav({ pendingReturns = 0 }: AdminNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navLinks: NavLink[] = [
    { label: "Dashboard", href: "/admin" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Products", href: "/admin/products" },
    { label: "Categories", href: "/admin/collections" },
    { label: "Reviews", href: "/admin/reviews" },
    { label: "Returns", href: "/admin/returns", badge: pendingReturns },
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Newsletter", href: "/admin/newsletter" },
    { label: "Promo Codes", href: "/admin/promo-codes" },
  ]

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="relative text-xs uppercase tracking-wider px-3 py-1.5 rounded transition-colors"
            style={{
              color: isActive(link.href) ? "#fff" : "rgba(255,255,255,0.6)",
              backgroundColor: isActive(link.href) ? "var(--color-accent)" : "transparent",
            }}
          >
            {link.label}
            {link.badge !== undefined && link.badge > 0 && (
              <span
                className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1 align-middle"
                style={{
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  lineHeight: 1,
                }}
                aria-label={`${link.badge} pending`}
              >
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <div className="sm:hidden relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative flex flex-col justify-center items-center w-8 h-8 gap-1.5"
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-0.5 transition-transform duration-200"
            style={{
              backgroundColor: "rgba(255,255,255,0.8)",
              transform: open ? "translateY(8px) rotate(45deg)" : "none",
            }}
          />
          <span
            className="block w-5 h-0.5 transition-opacity duration-200"
            style={{
              backgroundColor: "rgba(255,255,255,0.8)",
              opacity: open ? 0 : 1,
            }}
          />
          <span
            className="block w-5 h-0.5 transition-transform duration-200"
            style={{
              backgroundColor: "rgba(255,255,255,0.8)",
              transform: open ? "translateY(-8px) rotate(-45deg)" : "none",
            }}
          />
          {pendingReturns > 0 && !open && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full text-[9px] font-bold flex items-center justify-center"
              style={{ backgroundColor: "#dc2626", color: "#fff", lineHeight: 1 }}
              aria-hidden="true"
            >
              {pendingReturns}
            </span>
          )}
        </button>

        {open && (
          <div
            className="absolute left-0 top-full mt-2 w-56 rounded-lg shadow-xl z-50 overflow-hidden"
            style={{ backgroundColor: "var(--color-primary)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-xs uppercase tracking-wider transition-colors"
                style={{
                  color: isActive(link.href) ? "#fff" : "rgba(255,255,255,0.6)",
                  backgroundColor: isActive(link.href) ? "var(--color-accent)" : "transparent",
                }}
              >
                <span>{link.label}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span
                    className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[10px] font-bold px-1.5"
                    style={{
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                      lineHeight: 1,
                    }}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
