import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { AppUser } from "@/lib/auth";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

let _compose: Ratelimit | null = null;
let _interview: Ratelimit | null = null;
let _analyzeReply: Ratelimit | null = null;
let _extractField: Ratelimit | null = null;
let _outcome: Ratelimit | null = null;

function hasUpstashEnv(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getComposeLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_compose) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    _compose = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: true,
      prefix: "ratelimit:compose",
    });
  }
  return _compose;
}

function getInterviewLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_interview) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    _interview = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "ratelimit:interview",
    });
  }
  return _interview;
}

function getAnalyzeReplyLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_analyzeReply) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    _analyzeReply = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "ratelimit:analyze-reply",
    });
  }
  return _analyzeReply;
}

function getExtractFieldLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_extractField) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    _extractField = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(20, "1 d"),
      analytics: true,
      prefix: "ratelimit:extract-field",
    });
  }
  return _extractField;
}

function getOutcomeLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  if (!_outcome) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
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

export function isRateLimitEnabled(): boolean {
  return hasUpstashEnv();
}

export async function rateLimitCompose(user: AppUser): Promise<RateLimitResult> {
  const limiter = getComposeLimiter();
  if (!limiter) {
    return { success: true, limit: 30, remaining: 30, reset: Date.now() + 60_000 };
  }
  const r = await limiter.limit(user.id);
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

export async function rateLimitInterview(user: AppUser): Promise<RateLimitResult> {
  const limiter = getInterviewLimiter();
  if (!limiter) {
    return { success: true, limit: 60, remaining: 60, reset: Date.now() + 60_000 };
  }
  const r = await limiter.limit(user.id);
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

export async function rateLimitAnalyzeReply(user: AppUser): Promise<RateLimitResult> {
  const limiter = getAnalyzeReplyLimiter();
  if (!limiter) {
    return { success: true, limit: 60, remaining: 60, reset: Date.now() + 60_000 };
  }
  const r = await limiter.limit(user.id);
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

export async function rateLimitOutcome(user: AppUser): Promise<RateLimitResult> {
  const limiter = getOutcomeLimiter();
  if (!limiter) {
    return { success: true, limit: 10, remaining: 10, reset: Date.now() + 86_400_000 };
  }
  const r = await limiter.limit(user.id);
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

export async function rateLimitExtractField(user: AppUser): Promise<RateLimitResult> {
  const limiter = getExtractFieldLimiter();
  if (!limiter) {
    return { success: true, limit: 20, remaining: 20, reset: Date.now() + 86_400_000 };
  }
  const r = await limiter.limit(user.id);
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

export function tooManyRequestsResponse(result: RateLimitResult) {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please slow down and try again in a minute.",
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
