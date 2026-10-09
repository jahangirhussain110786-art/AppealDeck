import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { redisCredentials } from "@/lib/redisEnv";
import type { AppUser } from "@/lib/auth";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  /** True when the limiter itself could not answer (not configured, or the store is down): not the seller's doing. */
  unavailable?: boolean;
};

let _compose: Ratelimit | null = null;
let _analyzeReply: Ratelimit | null = null;
let _documentRead: Ratelimit | null = null;
let _outcome: Ratelimit | null = null;
let _wording: Ratelimit | null = null;
let _reminders: Ratelimit | null = null;

function hasUpstashEnv(): boolean {
  return redisCredentials() !== null;
}

function getComposeLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_compose) {
    const redis = new Redis(redisCredentials()!);
    _compose = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: true,
      prefix: "ratelimit:compose",
    });
  }
  return _compose;
}

function getAnalyzeReplyLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_analyzeReply) {
    const redis = new Redis(redisCredentials()!);
    _analyzeReply = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "ratelimit:analyze-reply",
    });
  }
  return _analyzeReply;
}

function getDocumentReadLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_documentRead) {
    const redis = new Redis(redisCredentials()!);
    _documentRead = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(20, "1 d"),
      analytics: true,
      prefix: "ratelimit:read-document",
    });
  }
  return _documentRead;
}

function getOutcomeLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_outcome) {
    const redis = new Redis(redisCredentials()!);
    // A seller shares an outcome once per case, rarely more than a handful of times ever —
    // a generous daily cap is purely an abuse guard, not an expected-usage ceiling.
    _outcome = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(10, "1 d"),
      analytics: true,
      prefix: "ratelimit:outcome",
    });
  }
  return _outcome;
}

function getWordingLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_wording) {
    const redis = new Redis(redisCredentials()!);
    // Wording help is asked for one section at a time and often more than once while a seller
    // works, so the cap is higher than document reading's — and it is a short text call, not a file.
    _wording = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(40, "1 d"),
      analytics: true,
      prefix: "ratelimit:improve-wording",
    });
  }
  return _wording;
}

let _draft: Ratelimit | null = null;
function getDraftLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_draft) {
    const redis = new Redis(redisCredentials()!);
    // New AI drafts only: a repeat of the same material is served from `draftCache` and never
    // reaches this. Twenty a day is a lot of real revisions for one seller and a ceiling on cost.
    _draft = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(20, "1 d"),
      analytics: true,
      prefix: "ratelimit:draft",
    });
  }
  return _draft;
}

function getRemindersLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_reminders) {
    const redis = new Redis(redisCredentials()!);
    // Its own limiter and key (30 Sep 2026). Reminders were counted against the outcome-sharing cap
    // of ten a day, so a seller moving a follow-up date a few times could use up the day's outcome
    // shares, and the eleventh date change was refused as "reminders are unavailable". Changing a
    // date is ordinary, repeated use; the cap is only an abuse guard.
    _reminders = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(60, "1 d"),
      analytics: true,
      prefix: "ratelimit:reminders",
    });
  }
  return _reminders;
}

let _decode: Ratelimit | null = null;
function getDecodeLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_decode) {
    const redis = new Redis(redisCredentials()!);
    // The free decoder is public and every first-time visitor uses it, so the cap is generous (a
    // seller pasting several notices in a row is normal) and is only there to stop a script.
    _decode = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, "1 m"),
      analytics: true,
      prefix: "ratelimit:decode",
    });
  }
  return _decode;
}

/**
 * Per-address limit for the free decoder. Unlike every other limiter here it FAILS OPEN: the route
 * is free, calls no paid service and is bounded in CPU (see `inputCost.test.ts`), so an unreachable
 * Redis must not stop a frightened seller from reading their notice.
 */
export async function rateLimitDecode(ip: string): Promise<RateLimitResult> {
  const open = { success: true, limit: 40, remaining: 40, reset: Date.now() + 60_000 };
  const limiter = getDecodeLimiter();
  if (!limiter) return open;
  try {
    const r = await limiter.limit(ip);
    return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
  } catch {
    return open;
  }
}

let _decodeAi: Ratelimit | null = null;
let _decodeAiGlobal: Ratelimit | null = null;

/**
 * The AI second reading on the free decoder (9 Oct 2026). Unlike the decoder itself this spends
 * money for visitors with no account, so it is capped twice: a few readings per address a day, and
 * a daily ceiling for everyone together that leaves the rest of the model allowance to sellers who
 * have paid. It FAILS CLOSED: without Redis, or when either cap is reached, the decoder answers
 * exactly as it did before and no model is called.
 */
export async function rateLimitDecodeAi(ip: string): Promise<boolean> {
  if (!hasUpstashEnv()) return false;
  try {
    if (!_decodeAi || !_decodeAiGlobal) {
      const redis = new Redis(redisCredentials()!);
      _decodeAi = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(3, "1 d"),
        prefix: "ratelimit:decode-ai",
      });
      _decodeAiGlobal = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(60, "1 d"),
        prefix: "ratelimit:decode-ai-global",
      });
    }
    const perIp = await _decodeAi.limit(ip);
    if (!perIp.success) return false;
    const everyone = await _decodeAiGlobal.limit("all");
    return everyone.success;
  } catch {
    return false;
  }
}

export function isRateLimitEnabled(): boolean {
  return hasUpstashEnv();
}

export async function rateLimitCompose(user: AppUser): Promise<RateLimitResult> {
  const limiter = getComposeLimiter();
  if (!limiter) {
    return {
      success: process.env.NODE_ENV !== "production",
      unavailable: process.env.NODE_ENV === "production",
      limit: 30,
      remaining: 30,
      reset: Date.now() + 60_000,
    };
  }
  let r;
  try {
    r = await limiter.limit(user.id);
  } catch {
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60_000,
      unavailable: true,
    };
  }
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

export async function rateLimitAnalyzeReply(user: AppUser): Promise<RateLimitResult> {
  const limiter = getAnalyzeReplyLimiter();
  if (!limiter) {
    return {
      success: process.env.NODE_ENV !== "production",
      unavailable: process.env.NODE_ENV === "production",
      limit: 60,
      remaining: 60,
      reset: Date.now() + 60_000,
    };
  }
  let r;
  try {
    r = await limiter.limit(user.id);
  } catch {
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60_000,
      unavailable: true,
    };
  }
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

export async function rateLimitOutcome(user: AppUser): Promise<RateLimitResult> {
  const limiter = getOutcomeLimiter();
  if (!limiter) {
    return {
      success: process.env.NODE_ENV !== "production",
      unavailable: process.env.NODE_ENV === "production",
      limit: 10,
      remaining: 10,
      reset: Date.now() + 86_400_000,
    };
  }
  let r;
  try {
    r = await limiter.limit(user.id);
  } catch {
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60_000,
      unavailable: true,
    };
  }
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

export async function rateLimitDocumentRead(user: AppUser): Promise<RateLimitResult> {
  const limiter = getDocumentReadLimiter();
  if (!limiter) {
    return {
      success: process.env.NODE_ENV !== "production",
      unavailable: process.env.NODE_ENV === "production",
      limit: 20,
      remaining: 20,
      reset: Date.now() + 86_400_000,
    };
  }
  let r;
  try {
    r = await limiter.limit(user.id);
  } catch {
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60_000,
      unavailable: true,
    };
  }
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

export async function rateLimitWording(user: AppUser): Promise<RateLimitResult> {
  const limiter = getWordingLimiter();
  if (!limiter) {
    return {
      success: process.env.NODE_ENV !== "production",
      unavailable: process.env.NODE_ENV === "production",
      limit: 40,
      remaining: 40,
      reset: Date.now() + 86_400_000,
    };
  }
  let r;
  try {
    r = await limiter.limit(user.id);
  } catch {
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60_000,
      unavailable: true,
    };
  }
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

export async function rateLimitDraft(user: AppUser): Promise<RateLimitResult> {
  const limiter = getDraftLimiter();
  if (!limiter) {
    return {
      success: process.env.NODE_ENV !== "production",
      unavailable: process.env.NODE_ENV === "production",
      limit: 20,
      remaining: 20,
      reset: Date.now() + 86_400_000,
    };
  }
  let r;
  try {
    r = await limiter.limit(user.id);
  } catch {
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60_000,
      unavailable: true,
    };
  }
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

export async function rateLimitReminders(user: AppUser): Promise<RateLimitResult> {
  const limiter = getRemindersLimiter();
  if (!limiter) {
    return {
      success: process.env.NODE_ENV !== "production",
      unavailable: process.env.NODE_ENV === "production",
      limit: 60,
      remaining: 60,
      reset: Date.now() + 86_400_000,
    };
  }
  let r;
  try {
    r = await limiter.limit(user.id);
  } catch {
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60_000,
      unavailable: true,
    };
  }
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

/**
 * "About 40 minutes", "about 5 hours" — for a limit that will not clear in the next minute.
 * Exported for the test.
 */
export function waitPhrase(seconds: number): string {
  if (seconds < 90 * 60) return `about ${Math.max(2, Math.round(seconds / 60))} minutes`;
  const hours = Math.round(seconds / 3600);
  return hours <= 1 ? "about an hour" : `about ${hours} hours`;
}

/**
 * The refusal. Its wording follows the window (30 Sep 2026): a per-minute limit does clear in a
 * minute, but document reading, wording help and outcome sharing are capped per day, and telling a
 * seller who has used their twentieth check "try again in a minute" sent them back to be refused
 * for up to a day, each time believing it was a passing hiccup.
 */
export function tooManyRequestsResponse(result: RateLimitResult) {
  // A limiter that cannot answer is the service's fault, and "slow down" tells a paying buyer to
  // wait out a problem that will not clear by waiting.
  if (result.unavailable) {
    return new Response(
      JSON.stringify({
        error: "This is not available right now. Please try again in a few minutes.",
      }),
      { status: 503, headers: { "Content-Type": "application/json", "Retry-After": "120" } },
    );
  }
  const seconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  const error =
    seconds <= 120
      ? "Too many requests. Please slow down and try again in a minute."
      : `You have used up the limit for this for now. It resets in ${waitPhrase(seconds)}.`;
  return new Response(
    JSON.stringify({
      error,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
        "Retry-After": String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))),
      },
    },
  );
}
