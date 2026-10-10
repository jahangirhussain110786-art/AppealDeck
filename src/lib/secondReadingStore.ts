import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { redisCredentials } from "@/lib/redisEnv";
import { isViolationKind, type ViolationKind } from "@/core/violationKinds";

/**
 * Server-side memory and counts for the AI second reading (10 Oct 2026, R-5 and R-2).
 *
 * Memory (R-5): the second reading is capped at three a day per address, and the decode page and
 * the case page share that cap, so pasting the same notice twice used to burn two of the three.
 * A reading is now remembered for seven days under a fingerprint of the notice (a SHA-256 hash).
 * What is stored is the kind and the position of the deciding sentence in the notice, never the
 * notice or the sentence itself: the quote is cut back out of the text the caller already holds,
 * so nothing a seller pasted is kept here. A "none" answer is remembered too, so a notice the
 * model could not place is not asked about again. Provider trouble is not remembered.
 *
 * Counts (R-2): one counter per outcome per day, with no notice text, no address and no kind, so
 * the founder can see how often the reading runs, how often it proposes something, and how often
 * it is refused before any analytics account exists. The client half (shown, used, kept or
 * changed by the seller) is in `src/lib/analytics.ts`.
 *
 * Without Redis configured both do nothing, exactly like the other optional stores.
 */
const TTL_SECONDS = 7 * 24 * 60 * 60;
const COUNT_TTL_SECONDS = 120 * 24 * 60 * 60;

export type StoredReading = { kind: ViolationKind; start: number; end: number } | { kind: "NONE" };

export type ReadingOutcome =
  "proposed" | "none" | "unverified" | "busy" | "unavailable" | "remembered" | "capped";

/**
 * Keyed on the exact decoded text (already normalised by the route), never a looser form: the
 * stored position is an offset into that text, so two texts sharing a key must be identical.
 */
export function readingKey(notice: string): string {
  const hash = createHash("sha256").update(notice).digest("hex").slice(0, 40);
  return `second-reading:v1:${hash}`;
}

/**
 * Where the model's quote sits in the notice. The classifier accepts a quote that matches with
 * whitespace and case squashed, so the search does the same. Null when it cannot be placed, in
 * which case the reading is used but not remembered.
 */
export function locateQuote(notice: string, quote: string): { start: number; end: number } | null {
  const words = quote.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const match = new RegExp(escaped.join("\\s+"), "i").exec(notice);
  return match ? { start: match.index, end: match.index + match[0].length } : null;
}

function client(): Redis | null {
  const credentials = redisCredentials();
  return credentials ? new Redis(credentials) : null;
}

export async function getRememberedReading(key: string): Promise<StoredReading | null> {
  const redis = client();
  if (!redis) return null;
  try {
    const value = await redis.get<StoredReading>(key);
    if (!value || typeof value !== "object") return null;
    if (value.kind === "NONE") return { kind: "NONE" };
    if (
      isViolationKind(value.kind) &&
      "start" in value &&
      Number.isInteger(value.start) &&
      Number.isInteger(value.end) &&
      value.end > value.start
    )
      return value;
  } catch {
    // A memory that cannot be read is the same as an empty one.
  }
  return null;
}

export async function rememberReading(key: string, reading: StoredReading): Promise<void> {
  const redis = client();
  if (!redis) return;
  try {
    await redis.set(key, reading, { ex: TTL_SECONDS });
  } catch {
    // Forgetting costs one model call next time, nothing more.
  }
}

export async function countReading(outcome: ReadingOutcome, now = new Date()): Promise<void> {
  const redis = client();
  if (!redis) return;
  const key = `stats:second-reading:${now.toISOString().slice(0, 10)}`;
  try {
    await redis.hincrby(key, outcome, 1);
    await redis.expire(key, COUNT_TTL_SECONDS);
  } catch {
    // A lost count never affects the seller.
  }
}
