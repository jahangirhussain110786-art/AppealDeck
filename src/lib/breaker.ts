import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

export type DegradedResponse = {
  ok: false;
  reason: "spend_cap" | "rate_limit" | "circuit_open";
  message: string;
  resetAt: number;
};

export type BreakerOptions = {
  name: string;
  spendCapPerDay: number;
  perMinuteLimit: number;
  errorRateThreshold: number;
  minVolumePerWindow: number;
  windowMs: number;
  cooldownMs: number;
  scope: "user" | "ip" | "none";
};

export type BreakerContext = {
  fingerprint: string;
  now: number;
};

export type BreakerOutcome =
  | { ok: true }
  | { ok: false; reason: "spend_cap"; resetAt: number; used: number; cap: number }
  | { ok: false; reason: "rate_limit"; resetAt: number; limit: number }
  | { ok: false; reason: "circuit_open"; resetAt: number };

let _redis: Redis | null = null;
let _rateLimiters = new Map<string, Ratelimit>();

function hasUpstashEnv(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function isBreakerEnabled(): boolean {
  return hasUpstashEnv();
}

function getRedis(): Redis | null {
  if (!hasUpstashEnv()) return null;
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

function getPerMinuteLimiter(name: string, perMinuteLimit: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${name}:${perMinuteLimit}`;
  let limiter = _rateLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(perMinuteLimit, "1 m"),
      analytics: false,
      prefix: `breaker:${name}:rate`,
    });
    _rateLimiters.set(key, limiter);
  }
  return limiter;
}

function dayKey(now: number): string {
  const d = new Date(now);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function spendKey(name: string, now: number): string {
  return `breaker:${name}:spend:${dayKey(now)}`;
}

function successKey(name: string, now: number): string {
  return `breaker:${name}:success:${dayKey(now)}`;
}

function failureKey(name: string, now: number): string {
  return `breaker:${name}:failure:${dayKey(now)}`;
}

function circuitKey(name: string): string {
  return `breaker:${name}:circuit:openUntil`;
}

export type CheckResult =
  | { allowed: true; context: BreakerContext }
  | { allowed: false; reason: "rate_limit"; resetAt: number }
  | { allowed: false; reason: "spend_cap"; resetAt: number; used: number; cap: number }
  | { allowed: false; reason: "circuit_open"; resetAt: number };

export async function checkBreaker(
  opts: BreakerOptions,
  fingerprint: string,
  now: number = Date.now(),
): Promise<CheckResult> {
  const redis = getRedis();
  if (!redis) {
    return { allowed: true, context: { fingerprint, now } };
  }

  const circuitUntil = Number((await redis.get(circuitKey(opts.name))) ?? 0);
  if (circuitUntil > now) {
    return { allowed: false, reason: "circuit_open", resetAt: circuitUntil };
  }

  if (opts.scope !== "none" && opts.perMinuteLimit > 0) {
    const limiter = getPerMinuteLimiter(opts.name, opts.perMinuteLimit);
    if (limiter) {
      const r = await limiter.limit(fingerprint);
      if (!r.success) {
        return { allowed: false, reason: "rate_limit", resetAt: r.reset };
      }
    }
  }

  if (opts.spendCapPerDay > 0) {
    const used = Number((await redis.incr(spendKey(opts.name, now))) ?? 0);
    if (used === 1) {
      await redis.expire(spendKey(opts.name, now), 90_000);
    }
    if (used > opts.spendCapPerDay) {
      return {
        allowed: false,
        reason: "spend_cap",
        resetAt: endOfDay(now),
        used,
        cap: opts.spendCapPerDay,
      };
    }
  }

  return { allowed: true, context: { fingerprint, now } };
}

export type RecordInput = {
  ok: boolean;
  context: BreakerContext;
};

export async function recordBreaker(
  opts: BreakerOptions,
  input: RecordInput,
): Promise<{ circuitOpened: boolean; newOpenUntil: number }> {
  const redis = getRedis();
  if (!redis) {
    return { circuitOpened: false, newOpenUntil: 0 };
  }

  const targetKey = input.ok
    ? successKey(opts.name, input.context.now)
    : failureKey(opts.name, input.context.now);
  const member = `${input.context.now}-${input.context.fingerprint}`;
  await redis.zadd(targetKey, { score: input.context.now, member });
  await redis.expire(targetKey, 90_000);

  if (input.ok) {
    return { circuitOpened: false, newOpenUntil: 0 };
  }

  const fKey = failureKey(opts.name, input.context.now);
  const windowStart = input.context.now - opts.windowMs;
  const [failures, successes] = await Promise.all([
    redis.zrange(fKey, windowStart, input.context.now, { byScore: true }),
    redis.zrange(successKey(opts.name, input.context.now), windowStart, input.context.now, {
      byScore: true,
    }),
  ]);
  const total = failures.length + successes.length;
  if (total < opts.minVolumePerWindow) {
    return { circuitOpened: false, newOpenUntil: 0 };
  }

  const errorRate = failures.length / total;
  if (errorRate < opts.errorRateThreshold) {
    return { circuitOpened: false, newOpenUntil: 0 };
  }

  const openUntil = input.context.now + opts.cooldownMs;
  await redis.set(circuitKey(opts.name), openUntil, { px: opts.cooldownMs });
  return { circuitOpened: true, newOpenUntil: openUntil };
}

export function degradedResponse(outcome: CheckResult, opts: BreakerOptions): Response {
  if (!("reason" in outcome)) {
    return new Response(JSON.stringify({ error: "Breaker not in degraded state." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const body: DegradedResponse = {
    ok: false,
    reason: outcome.reason,
    message: degradedMessage(outcome.reason),
    resetAt: outcome.resetAt,
  };
  const status = outcome.reason === "circuit_open" ? 503 : 429;
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(Math.max(1, Math.ceil((outcome.resetAt - Date.now()) / 1000))),
      "X-Breaker-Reason": outcome.reason,
      "X-Breaker-Name": opts.name,
    },
  });
}

type DegradeReason = "spend_cap" | "rate_limit" | "circuit_open";

function degradedMessage(reason: DegradeReason): string {
  switch (reason) {
    case "spend_cap":
      return "Daily cloud spend limit reached. Service is in a reduced mode and will return to full capacity at the next budget window.";
    case "rate_limit":
      return "Too many requests for this device. Please slow down and try again in a minute.";
    case "circuit_open":
      return "Cloud service is temporarily degraded while we recover. Falling back to rules-only mode.";
  }
}

export function fingerprintForRequest(req: NextRequest, userId?: string | null): string {
  const ua = req.headers.get("user-agent") ?? "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";
  const lang = req.headers.get("accept-language") ?? "";
  return fnv1aHash([userId ?? "", ua, ip, lang].join("|"));
}

function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function endOfDay(now: number): number {
  const d = new Date(now);
  d.setUTCHours(23, 59, 59, 999);
  return d.getTime();
}

export type WithBreakerHandler = (req: NextRequest, ctx: BreakerContext) => Promise<Response>;

export type WithBreakerDeps = {
  check: typeof checkBreaker;
  record: typeof recordBreaker;
};

export function withBreaker(
  opts: BreakerOptions,
  handler: WithBreakerHandler,
  deps: Partial<WithBreakerDeps> = {},
): WithBreakerHandler {
  const check = deps.check ?? checkBreaker;
  const record = deps.record ?? recordBreaker;
  return async (req: NextRequest, _ctx: BreakerContext) => {
    const fp = fingerprintForRequest(req);
    const outcome = await check(opts, fp);
    if (!outcome.allowed) {
      return degradedResponse(outcome, opts);
    }
    const response = await handler(req, outcome.context);
    const ok = response.status >= 200 && response.status < 500;
    await record(opts, { ok, context: outcome.context });
    return response;
  };
}
