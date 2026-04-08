"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navLinks = [
  { label: "Dashboard", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Products", href: "/admin/products" },
  { label: "Collections", href: "/admin/collections" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Newsletter", href: "/admin/newsletter" },
  { label: "Promo Codes", href: "/admin/promo-codes" },
]

export default function AdminNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

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
            className="text-xs uppercase tracking-wider px-3 py-1.5 rounded transition-colors"
            style={{
              color: isActive(link.href) ? "#fff" : "rgba(255,255,255,0.6)",
              backgroundColor: isActive(link.href) ? "var(--color-accent)" : "transparent",
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <div className="sm:hidden relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex flex-col justify-center items-center w-8 h-8 gap-1.5"
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
        </button>

        {open && (
          <div
            className="absolute left-0 top-full mt-2 w-48 rounded-lg shadow-xl z-50 overflow-hidden"
            style={{ backgroundColor: "var(--color-primary)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-xs uppercase tracking-wider transition-colors"
                style={{
                  color: isActive(link.href) ? "#fff" : "rgba(255,255,255,0.6)",
                  backgroundColor: isActive(link.href) ? "var(--color-accent)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
