"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navLinks = [
  { label: "Dashboard", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Products", href: "/admin/products" },
  { label: "Collections", href: "/admin/collections" },
  { label: "Analytics", href: "/admin/analytics" },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden sm:flex items-center gap-1">
      {navLinks.map((link) => {
        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs uppercase tracking-wider px-3 py-1.5 rounded transition-colors"
            style={{
              color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
              backgroundColor: isActive ? "var(--color-accent)" : "transparent",
            }}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
