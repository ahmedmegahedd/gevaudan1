"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { storeConfig } from "@/config/store.config"
import { useCartStore } from "@/store/cartStore"
import { useWishlistStore } from "@/store/wishlistStore"

const { brand } = storeConfig

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Returns & Exchange", href: "/returns" },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const wishlistCount = useWishlistStore((s) => s.items.length)

  // Close menu on any navigation
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full"
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 h-[60px] md:h-[70px] flex items-center justify-between gap-4">
        {/* Logo / Brand — Zapfino has tall ascenders/descenders, so size it down
            on mobile and clamp line-height to keep it inside the navbar. */}
        <Link
          href="/"
          className="flex flex-col leading-none shrink-0 overflow-hidden"
          onClick={() => setMenuOpen(false)}
        >
          <span
            className="brand-script text-white block"
            style={{
              fontSize: "clamp(20px, 5.5vw, 30px)",
              lineHeight: 0.95,
            }}
          >
            {brand.name}
          </span>
          <span
            className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-light mt-0.5"
            style={{ color: "var(--color-cream)" }}
          >
            {brand.subtitle}
          </span>
        </Link>

        {/* Desktop: nav links */}
        <div className="hidden md:flex items-center flex-1 justify-end">
          <ul className="flex items-center gap-10">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[11px] uppercase font-medium text-white/70 hover:text-white"
                    style={{ letterSpacing: "0.15em" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}

              {/* Wishlist */}
              <li>
                <Link
                  href="/wishlist"
                  className="relative flex items-center gap-2 text-[11px] uppercase font-medium text-white/70 hover:text-white"
                  style={{ letterSpacing: "0.15em" }}
                  aria-label="Wishlist"
                >
                  <HeartIcon />
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span
                      className="absolute -top-2 -right-3 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: "var(--color-accent)" }}
                    >
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </li>

              {/* Cart */}
              <li>
                <Link
                  href="/cart"
                  className="relative flex items-center gap-2 text-[11px] uppercase font-medium text-white/70 hover:text-white"
                  style={{ letterSpacing: "0.15em" }}
                  aria-label="Cart"
                >
                  <CartIcon />
                  <span>Cart</span>
                  {itemCount > 0 && (
                    <span
                      className="absolute -top-2 -right-3 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: "var(--color-accent)" }}
                    >
                      {itemCount}
                    </span>
                  )}
                </Link>
              </li>

              {/* Admin */}
              <li>
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-[10px] uppercase font-semibold px-4 py-2 rounded-[2px] hover:opacity-80"
                  style={{ backgroundColor: "var(--color-accent)", color: "#fff", letterSpacing: "0.18em" }}
                >
                  <AdminIcon />
                  Admin
                </Link>
              </li>
            </ul>
        </div>

        {/* Mobile: wishlist + cart + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <Link
            href="/wishlist"
            className="relative flex items-center justify-center w-11 h-11 text-white/70 hover:text-white"
            aria-label="Wishlist"
          >
            <HeartIcon />
            {wishlistCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-[16px] rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: "var(--color-accent)" }}
              >
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="relative flex items-center justify-center w-11 h-11 text-white/70 hover:text-white"
            aria-label="Cart"
          >
            <CartIcon />
            {itemCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-[16px] rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: "var(--color-accent)" }}
              >
                {itemCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center justify-center w-11 h-11 text-white/70 hover:text-white"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <div
          className="md:hidden w-full"
          style={{
            backgroundColor: "var(--color-mid2)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Logo / brand at top of drawer */}
          <MobileDrawerLogo />

          <ul className="flex flex-col">
            {navLinks.map((link) => (
              <li
                key={link.href}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Link
                  href={link.href}
                  className="block px-6 py-5 text-base font-medium text-white/80 hover:text-white"
                  style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.02em" }}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Link
                href="/wishlist"
                className="flex items-center gap-2 px-6 py-5 text-base font-medium text-white/80 hover:text-white"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.02em" }}
                onClick={() => setMenuOpen(false)}
              >
                Wishlist
                {wishlistCount > 0 && (
                  <span
                    className="min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white px-1"
                    style={{ backgroundColor: "var(--color-accent)" }}
                  >
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </li>
            <li style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Link
                href="/cart"
                className="flex items-center gap-2 px-6 py-5 text-base font-medium text-white/80 hover:text-white"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.02em" }}
                onClick={() => setMenuOpen(false)}
              >
                Cart
                {itemCount > 0 && (
                  <span
                    className="min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white px-1"
                    style={{ backgroundColor: "var(--color-accent)" }}
                  >
                    {itemCount}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-6 py-5 text-base font-semibold"
                style={{ backgroundColor: "var(--color-accent)", color: "#fff", letterSpacing: "0.05em" }}
                onClick={() => setMenuOpen(false)}
              >
                <AdminIcon />
                Admin Panel
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}

function MobileDrawerLogo() {
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className="flex items-center justify-center py-10"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      {!imgError ? (
        <Image
          src="/logo.png"
          alt={brand.name}
          width={480}
          height={200}
          style={{ maxHeight: 200, width: "auto", objectFit: "contain" }}
          onError={() => setImgError(true)}
          priority
        />
      ) : (
        <span
          className="brand-script text-white"
          style={{ fontSize: 36 }}
        >
          {brand.name}
        </span>
      )}
    </div>
  )
}

function HeartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
