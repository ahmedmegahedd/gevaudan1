interface StarsProps {
  /** 0–5 rating; supports fractional values for half-star fills. */
  value: number
  /** Pixel size of each star (default 14). */
  size?: number
  /** Override fill color; defaults to var(--color-accent). */
  color?: string
  /** Override empty/track color. */
  emptyColor?: string
  className?: string
  /** Adds aria-label like "Rated 4.2 out of 5". */
  ariaLabelValue?: number
}

/**
 * Read-only star rating display. Renders 5 stars and overlays a clipped row
 * of filled stars on top — supports fractional fills (★★★★½).
 */
export default function Stars({
  value,
  size = 14,
  color = "var(--color-accent)",
  emptyColor = "rgba(61,20,25,0.18)",
  className,
  ariaLabelValue,
}: StarsProps) {
  const clamped = Math.max(0, Math.min(5, value))
  const fillPct = (clamped / 5) * 100
  const ariaLabel =
    ariaLabelValue !== undefined
      ? `Rated ${ariaLabelValue.toFixed(1)} out of 5`
      : `${clamped.toFixed(1)} out of 5 stars`

  const sharedStyle: React.CSSProperties = {
    fontSize: size,
    lineHeight: 1,
    letterSpacing: 1,
  }

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}
    >
      {/* Empty track */}
      <span style={{ ...sharedStyle, color: emptyColor }}>★★★★★</span>
      {/* Filled overlay */}
      <span
        aria-hidden="true"
        style={{
          ...sharedStyle,
          position: "absolute",
          top: 0,
          left: 0,
          color,
          width: `${fillPct}%`,
          overflow: "hidden",
        }}
      >
        ★★★★★
      </span>
    </span>
  )
}
