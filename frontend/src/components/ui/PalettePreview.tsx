"use client"

import { useEffect } from "react"

/**
 * Mounts on a route to temporarily override the global palette by setting
 * `<html data-palette="…">`. CSS variables defined under
 * `html[data-palette="…"]` in globals.css cascade through the entire tree —
 * including the navbar/footer rendered above this component — so the page
 * looks fully rebranded while it's mounted.
 *
 * On unmount the attribute is removed and the site returns to the global
 * palette, so other routes are unaffected.
 *
 * Renders no DOM.
 */
export default function PalettePreview({ palette }: { palette: "forest" }) {
  useEffect(() => {
    const root = document.documentElement
    const prev = root.getAttribute("data-palette")
    root.setAttribute("data-palette", palette)
    return () => {
      if (prev === null) root.removeAttribute("data-palette")
      else root.setAttribute("data-palette", prev)
    }
  }, [palette])
  return null
}
