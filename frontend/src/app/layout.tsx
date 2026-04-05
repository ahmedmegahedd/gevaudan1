import type { Metadata } from "next"
import { Cormorant_Garamond, Inter } from "next/font/google"
import { storeConfig } from "@/config/store.config"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import ToastContainer from "@/components/ui/Toast"
import "./globals.css"

const headingFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
  display: "swap",
})

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: storeConfig.brand.name,
    template: `%s | ${storeConfig.brand.name}`,
  },
  description: storeConfig.brand.tagline,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <ToastContainer />
      </body>
    </html>
  )
}
