"use client"

import { useState } from "react"
import { storeConfig } from "@/config/store.config"

const { accentColor } = storeConfig.theme

type TabKey = "description" | "composition" | "measurements"

interface ProductTabsProps {
  description: string | null
  composition: string | null
  measurements: string | null
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "description", label: "Description" },
  { key: "composition", label: "Composition" },
  { key: "measurements", label: "Measurements" },
]

export default function ProductTabs({ description, composition, measurements }: ProductTabsProps) {
  const [active, setActive] = useState<TabKey>("description")

  const content: Record<TabKey, string | null> = {
    description,
    composition,
    measurements,
  }

  return (
    <section
      className="py-12 md:py-20"
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* ── Tab triggers ── */}
        <div
          role="tablist"
          aria-label="Product details"
          className="flex overflow-x-auto scrollbar-hide w-full"
          style={{ borderBottom: `1px solid ${accentColor}33` }}
        >
          {TABS.map((tab) => {
            const isActive = active === tab.key
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.key}`}
                id={`tab-${tab.key}`}
                onClick={() => setActive(tab.key)}
                className="flex-1 md:flex-none min-w-[140px] md:min-w-[180px] px-6 py-4 text-[11px] uppercase whitespace-nowrap"
                style={{
                  background: "transparent",
                  color: isActive ? "#ffffff" : accentColor,
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: "0.2em",
                  borderBottom: isActive
                    ? `2px solid ${accentColor}`
                    : `1px solid ${accentColor}`,
                  marginBottom: isActive ? "-1px" : "0",
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Tab panels (cross-fade) ── */}
        <div className="relative pt-10 md:pt-12 min-h-[120px]">
          {TABS.map((tab) => {
            const isActive = active === tab.key
            const value = content[tab.key]
            return (
              <div
                key={tab.key}
                role="tabpanel"
                id={`panel-${tab.key}`}
                aria-labelledby={`tab-${tab.key}`}
                hidden={!isActive}
                style={{
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 0.2s ease",
                }}
              >
                {value && value.trim().length > 0 ? (
                  <p
                    className="text-base md:text-lg max-w-3xl whitespace-pre-line"
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      lineHeight: 1.8,
                    }}
                  >
                    {value}
                  </p>
                ) : (
                  <p
                    className="text-base italic"
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      lineHeight: 1.8,
                    }}
                  >
                    No information available
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
