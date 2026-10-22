/**
 * Partner codes (22 Oct 2026, the partner program on /partners).
 *
 * A partner (a writer, a trainer, a community) is given a code and a link, `?ref=CODE`. A seller who
 * arrives by it keeps the code on their own device for 60 days, and it goes to Paddle's checkout as
 * a discount code. Nothing about the seller is sent anywhere, and the code is never stored on our
 * server: Paddle's own transaction record carries the discount code, which is how the partner's
 * commission is worked out.
 *
 * First click wins until it expires, so a later link cannot take a sale from the partner who
 * introduced the seller. The code is only ever held as a plain string a seller can see and remove.
 */

export const PARTNER_CODE_KEY = "appealdeck.partnerCode";
export const PARTNER_CODE_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/** A code is letters, digits, "-" and "_", three to thirty-two characters, upper case. */
const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;

/** The code in a link or a form, normalised; null when it is not a usable code. */
export function parsePartnerCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return CODE_RE.test(code) ? code : null;
}

type StoredCode = { code: string; at: number };

function parseStored(raw: string | null): StoredCode | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredCode> | null;
    const code = parsePartnerCode(value?.code);
    if (!code || typeof value?.at !== "number" || !Number.isFinite(value.at)) return null;
    return { code, at: value.at };
  } catch {
    return null;
  }
}

function defaultStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The code still in its 60 days, or null. An expired or damaged entry is removed. */
export function readPartnerCode(
  now: number = Date.now(),
  storage: Storage | null = defaultStorage(),
): string | null {
  if (!storage) return null;
  try {
    const stored = parseStored(storage.getItem(PARTNER_CODE_KEY));
    if (stored && now - stored.at >= 0 && now - stored.at < PARTNER_CODE_DAYS * DAY_MS)
      return stored.code;
    if (storage.getItem(PARTNER_CODE_KEY) !== null) storage.removeItem(PARTNER_CODE_KEY);
  } catch {
    // Storage that refuses access (private windows, blocked site data): no code, nothing breaks.
  }
  return null;
}

/**
 * Keep the code for 60 days. Returns the code now held: the new one, or the earlier one that is
 * still inside its window (first click wins), or null when it could not be kept.
 */
export function rememberPartnerCode(
  raw: unknown,
  now: number = Date.now(),
  storage: Storage | null = defaultStorage(),
): string | null {
  const code = parsePartnerCode(raw);
  if (!code || !storage) return readPartnerCode(now, storage);
  const held = readPartnerCode(now, storage);
  if (held) return held;
  try {
    storage.setItem(PARTNER_CODE_KEY, JSON.stringify({ code, at: now } satisfies StoredCode));
  } catch {
    return null;
  }
  notifyPartnerCodeChanged();
  return code;
}

/** The seller's own choice to drop the code. */
export function forgetPartnerCode(storage: Storage | null = defaultStorage()): void {
  try {
    storage?.removeItem(PARTNER_CODE_KEY);
  } catch {
    // nothing to do
  }
  notifyPartnerCodeChanged();
}

/** Sent when the held code changes, so a mounted component (the note by the pay button) redraws. */
export const PARTNER_CODE_EVENT = "appealdeck:partner-code";

export function notifyPartnerCodeChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PARTNER_CODE_EVENT));
}
