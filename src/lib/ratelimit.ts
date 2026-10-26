import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { redisCredentials } from "@/lib/redisEnv";
import type { AppUser } from "@/lib/auth";
import { hasUnlimitedDevUsage, isUnlimitedDevUser } from "@/lib/devUsage";

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

let _referral: Ratelimit | null = null;
function getReferralLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_referral) {
    const redis = new Redis(redisCredentials()!);
    // Checking a partner code used to be counted against the compose cap, so a seller who mistyped a
    // code while writing a response could use up the allowance they needed to draft it, and Upstash
    // showed the attempts as drafts (26 Oct 2026). Ten a minute is far more than a real retry.
    _referral = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "ratelimit:referral",
    });
  }
  return _referral;
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
  if (hasUnlimitedDevUsage()) return unlimitedRate();
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
  if (hasUnlimitedDevUsage()) return true;
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
  if (isUnlimitedDevUser(user)) return unlimitedRate();
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
  if (isUnlimitedDevUser(user)) return unlimitedRate();
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
  if (isUnlimitedDevUser(user)) return unlimitedRate();
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
  if (isUnlimitedDevUser(user)) return unlimitedRate();
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
  if (isUnlimitedDevUser(user)) return unlimitedRate();
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
  if (isUnlimitedDevUser(user)) return unlimitedRate();
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
  if (isUnlimitedDevUser(user)) return unlimitedRate();
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

/** A partner code typed at checkout: its own cap, so a mistyped one costs nothing else. */
export async function rateLimitReferral(user: AppUser): Promise<RateLimitResult> {
  if (isUnlimitedDevUser(user)) return unlimitedRate();
  const limiter = getReferralLimiter();
  if (!limiter) {
    return {
      success: process.env.NODE_ENV !== "production",
      unavailable: process.env.NODE_ENV === "production",
      limit: 10,
      remaining: 10,
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

function unlimitedRate(): RateLimitResult {
  return {
    success: true,
    limit: Number.MAX_SAFE_INTEGER,
    remaining: Number.MAX_SAFE_INTEGER,
    reset: 0,
  };
}

/** A document review includes this many AI readings, for the case it was bought for. */
export const REVIEW_READS_PER_CASE = 5;

const REVIEW_READS_TTL_SECONDS = 365 * 24 * 60 * 60;

function reviewReadsKey(userId: string, caseId: string): string {
  return `review-reads:${userId}:${caseId}`;
}

/**
 * How many of a document review's readings are left for a case. Counted by successful readings only
 * (`recordReviewRead`), so a reading that failed costs nothing. `unavailable` means the counter
 * could not be read: the route then refuses rather than guess, because an unlimited review would
 * cost real money on the AI.
 */
export async function reviewReadsLeft(
  user: AppUser,
  caseId: string,
): Promise<{ left: number; unavailable?: boolean }> {
  if (isUnlimitedDevUser(user)) return { left: REVIEW_READS_PER_CASE };
  if (!hasUpstashEnv())
    return process.env.NODE_ENV === "production"
      ? { left: 0, unavailable: true }
      : { left: REVIEW_READS_PER_CASE };
  try {
    const redis = new Redis(redisCredentials()!);
    const used = Number((await redis.get(reviewReadsKey(user.id, caseId))) ?? 0);
    return { left: Math.max(0, REVIEW_READS_PER_CASE - (Number.isFinite(used) ? used : 0)) };
  } catch {
    return { left: 0, unavailable: true };
  }
}

/** Counts one successful reading against a document review. Never throws: a missed count is not the seller's problem. */
export async function recordReviewRead(user: AppUser, caseId: string): Promise<void> {
  if (isUnlimitedDevUser(user) || !hasUpstashEnv()) return;
  try {
    const redis = new Redis(redisCredentials()!);
    const key = reviewReadsKey(user.id, caseId);
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, REVIEW_READS_TTL_SECONDS);
  } catch {
    // swallowed on purpose
  }
}

let _guestReminder: Ratelimit | null = null;
let _guestReminderAll: Ratelimit | null = null;

/**
 * The guest deadline reminder (23 Oct 2026): a public form that makes us send an email to whatever
 * address is typed, so it is capped twice, a few requests per address of the visitor a day and a daily
 * ceiling for everyone, and it FAILS CLOSED. Without Redis in production, or when either cap is
 * reached, no email is sent and the visitor is told reminders are unavailable. The decoder itself is
 * unaffected. (The double opt-in in `guestReminders.ts` is what stops a typed address being spammed;
 * this is what stops the form being used to burn the email allowance.)
 */
export async function rateLimitGuestReminder(ip: string): Promise<boolean> {
  if (hasUnlimitedDevUsage()) return true;
  if (!hasUpstashEnv()) return process.env.NODE_ENV !== "production";
  try {
    if (!_guestReminder || !_guestReminderAll) {
      const redis = new Redis(redisCredentials()!);
      _guestReminder = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(5, "1 d"),
        prefix: "ratelimit:guest-reminder",
      });
      _guestReminderAll = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(300, "1 d"),
        prefix: "ratelimit:guest-reminder-all",
      });
    }
    const perIp = await _guestReminder.limit(ip);
    if (!perIp.success) return false;
    return (await _guestReminderAll.limit("all")).success;
  } catch {
    return false;
  }
}
