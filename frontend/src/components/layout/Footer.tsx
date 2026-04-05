import { storeConfig } from "@/config/store.config"

export default function Footer() {
  const { brand, contact, delivery } = storeConfig
  const year = new Date().getFullYear()

  return (
    <footer
      className="border-t mt-auto"
      style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p
              className="text-2xl font-bold tracking-widest mb-2"
              style={{ color: "var(--color-accent)", fontFamily: "var(--font-heading)" }}
            >
              {brand.name}
            </p>
            <p className="text-white/60 text-sm leading-relaxed">{brand.tagline}</p>
          </div>

          {/* Delivery cities */}
          <div>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-4">
              We Deliver To
            </h3>
            <ul className="space-y-1">
              {delivery.cities.map((city) => (
                <li key={city} className="text-sm text-white/70">
                  {city}
                </li>
              ))}
            </ul>
          </div>

          {/* Social / Contact */}
          <div>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-4">
              Find Us
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  {contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://instagram.com/${contact.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Instagram: {contact.instagram}
                </a>
              </li>
              <li>
                <a
                  href={`https://facebook.com/${contact.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Facebook: {contact.facebook}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/40">
            &copy; {year} {brand.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
