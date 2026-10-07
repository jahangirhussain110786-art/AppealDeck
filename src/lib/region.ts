/**
 * Where the Appeal Pass is not sold yet.
 *
 * Founder decision, 7 Oct 2026: focus on the US marketplace first and Saudi Arabia next, and do not
 * sell to the EU, the wider EEA or the UK until the privacy and consumer-law work for them is done.
 * The gate is on the *buyer's* country (the request's IP location, which Vercel supplies), because
 * that is what decides which consumer and privacy law applies to the sale. It is not about which
 * Amazon store the seller sells on: a UK-based seller of amazon.com goods is still a UK buyer.
 *
 * Only checkout is gated. The free decoder stays open everywhere: it cannot be reliably geo-blocked,
 * and the privacy policy applies to it either way. A visitor whose country cannot be determined is
 * allowed through (local development, a proxy that strips the header); the gate is a policy, not a
 * security boundary, and Paddle's own country restrictions are the second line (DEPLOYMENT step 5b).
 *
 * `BLOCKED_PURCHASE_COUNTRIES` overrides the list (comma-separated ISO codes); `none` switches the
 * gate off, which is the one change needed on the day those markets open.
 */
export const DEFAULT_BLOCKED_COUNTRIES: readonly string[] = [
  // European Union
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  // The rest of the EEA
  "IS",
  "LI",
  "NO",
  // The United Kingdom
  "GB",
];

export function blockedCountries(
  setting: string | undefined = process.env.BLOCKED_PURCHASE_COUNTRIES,
): string[] {
  const raw = setting?.trim();
  if (!raw) return [...DEFAULT_BLOCKED_COUNTRIES];
  if (raw.toLowerCase() === "none") return [];
  return raw
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c));
}

/** True when a buyer in this country (ISO code from the request, or null if unknown) cannot buy yet. */
export function isPurchaseBlocked(country: string | null | undefined, setting?: string): boolean {
  if (!country) return false;
  return blockedCountries(setting).includes(country.trim().toUpperCase());
}

export const REGION_BLOCKED_MESSAGE =
  "The Appeal Pass is not on sale in your region yet. The free decoder still works, and your case stays on your device.";
