import type { Metadata } from "next"
import { Cormorant_Garamond, Inter, Allura } from "next/font/google"
import { storeConfig } from "@/config/store.config"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import ToastContainer from "@/components/ui/Toast"
import CookieConsent from "@/components/ui/CookieConsent"
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

// Allura — fallback for the brand wordmark when Zapfino isn't on the user's machine
const scriptFont = Allura({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-script",
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
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} ${scriptFont.variable} bg-[#F1E9D9]`}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen flex flex-col bg-[#F1E9D9]" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1 pt-[60px] md:pt-[70px]">{children}</main>
        <Footer />
        <ToastContainer />
        <CookieConsent />
      </body>
    </html>
  )
}
