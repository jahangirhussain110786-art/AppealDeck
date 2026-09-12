/**
 * Layered magnifier-over-document illustration (AM-22/V2) — matches
 * Decode.dc.html §2.6. Colors are CSS variables so it inherits the current
 * theme automatically.
 */
export function MagnifierDocumentIllustration({
  size = 60,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const lensId = "magnifier-doc-lens";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={lensId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.85" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </linearGradient>
      </defs>
      <rect
        x="10"
        y="6"
        width="26"
        height="34"
        rx="3"
        fill="hsl(var(--surface-1))"
        stroke="hsl(var(--border))"
        strokeWidth="1.5"
      />
      <rect x="15" y="13" width="16" height="2.4" rx="1.2" fill="hsl(var(--border))" />
      <rect x="15" y="19" width="16" height="2.4" rx="1.2" fill="hsl(var(--border))" />
      <rect x="15" y="25" width="10" height="2.4" rx="1.2" fill="hsl(var(--border))" />
      <circle cx="36" cy="34" r="13" fill={`url(#${lensId})`} opacity="0.12" />
      <circle
        cx="36"
        cy="34"
        r="10"
        fill="hsl(var(--surface-1))"
        stroke={`url(#${lensId})`}
        strokeWidth="2.4"
      />
      <line
        x1="43.5"
        y1="41.5"
        x2="50"
        y2="48"
        stroke={`url(#${lensId})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
