/**
 * Layered vault-door illustration (AM-22/V2) — a radial glow, a ringed dial,
 * and a handle, instead of a flat lock icon. Matches Vault.dc.html §2.6.
 * Colors are CSS variables (--success as the mint-family accent since the
 * vault no longer carries its own hardcoded palette — see V6), so it
 * inherits the current theme automatically, light or dark.
 */
export function VaultDoorIllustration({
  size = 52,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const glowId = "vault-door-glow";
  const ringId = "vault-door-ring";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--success))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </linearGradient>
      </defs>
      <circle cx="26" cy="26" r="26" fill={`url(#${glowId})`} />
      <circle
        cx="26"
        cy="26"
        r="19"
        fill="hsl(var(--surface-2))"
        stroke={`url(#${ringId})`}
        strokeWidth="1.5"
      />
      <circle
        cx="26"
        cy="26"
        r="13.5"
        fill="none"
        stroke={`url(#${ringId})`}
        strokeWidth="1.2"
        strokeDasharray="1.5 4"
      />
      <rect x="19.5" y="23" width="13" height="10" rx="2.4" fill={`url(#${ringId})`} />
      <path
        d="M22 23v-4a4 4 0 0 1 8 0v4"
        fill="none"
        stroke={`url(#${ringId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="26" cy="27.8" r="1.6" fill="hsl(var(--surface-1))" />
    </svg>
  );
}
