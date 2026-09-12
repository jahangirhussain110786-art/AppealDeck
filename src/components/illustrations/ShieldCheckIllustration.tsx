/**
 * Layered shield-check illustration (AM-22/V2) — gradient-filled shield, a
 * subtle highlight layer, and a checkmark. Original artwork, not a flat icon;
 * matches the trust badge on Main.dc.html §2.6. Colors are CSS variables, so
 * the illustration inherits the current theme automatically.
 */
export function ShieldCheckIllustration({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const gradId = "shield-check-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.85" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </linearGradient>
      </defs>
      <path d="M20 3 34 8v10c0 10-6 16.5-14 19-8-2.5-14-9-14-19V8z" fill={`url(#${gradId})`} />
      <path d="M20 3 34 8v10c0 10-6 16.5-14 19V3z" className="fill-white" opacity="0.1" />
      <path
        d="M13.5 20.5 18 25l9-10.5"
        fill="none"
        className="stroke-white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
