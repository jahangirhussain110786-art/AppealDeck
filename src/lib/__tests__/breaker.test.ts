import { describe, expect, it } from "vitest";
import {
  checkBreaker,
  degradedResponse,
  isBreakerEnabled,
  recordBreaker,
  reserveSpend,
  withBreaker,
  type BreakerContext,
  type BreakerOptions,
  type CheckResult,
  type WithBreakerHandler,
} from "../breaker";
import type { NextRequest } from "next/server";
import { __test as geminiTest } from "../llm/gemini";

const baseOpts: BreakerOptions = {
  name: "test",
  spendCapPerDay: 100,
  perMinuteLimit: 10,
  errorRateThreshold: 0.5,
  minVolumePerWindow: 5,
  windowMs: 60_000,
  cooldownMs: 30_000,
  scope: "none",
};

/** An in-memory stand-in for the two Redis calls `reserveSpend` makes. */
function fakeRedis() {
  const counts = new Map<string, number>();
  return {
    counts,
    incr: async (key: string) => {
      const n = (counts.get(key) ?? 0) + 1;
      counts.set(key, n);
      return n;
    },
    expire: async () => 1 as const,
  } as unknown as Parameters<typeof reserveSpend>[2] & { counts: Map<string, number> };
}

describe("reserveSpend — the daily cap counts paid calls, not requests (24 Sep 2026)", () => {
  const capOpts: BreakerOptions = { ...baseOpts, spendCapPerDay: 3, spendCountedAt: "call" };

  it("allows calls up to the cap and refuses the next one until the day ends", async () => {
    const redis = fakeRedis();
    const now = Date.parse("2026-09-24T10:00:00Z");
    for (let i = 0; i < 3; i++) expect((await reserveSpend(capOpts, now, redis)).ok).toBe(true);
    const over = await reserveSpend(capOpts, now, redis);
    expect(over).toMatchObject({ ok: false, cap: 3 });
    expect(over.ok === false && over.resetAt).toBe(Date.parse("2026-09-24T23:59:59.999Z"));
  });

  it("starts a fresh budget on the next UTC day", async () => {
    const redis = fakeRedis();
    for (let i = 0; i < 4; i++)
      await reserveSpend(capOpts, Date.parse("2026-09-24T22:00:00Z"), redis);
    expect((await reserveSpend(capOpts, Date.parse("2026-09-25T00:10:00Z"), redis)).ok).toBe(true);
  });

  it("fails closed when Redis errors, as the door check does", async () => {
    const broken = {
      incr: async () => {
        throw new Error("down");
      },
      expire: async () => 1,
    } as unknown as Parameters<typeof reserveSpend>[2];
    expect((await reserveSpend(capOpts, Date.now(), broken)).ok).toBe(false);
  });

  it("the Gemini breaker counts at the call, so a refused request cannot spend the budget", () => {
    // The door check runs before sign-in and the Pass check; counting there let anonymous
    // requests switch AI reading off for every seller.
    expect(geminiTest.breakerOptions.spendCountedAt).toBe("call");
  });
});

describe("breaker (no Upstash configured)", () => {
  it("isBreakerEnabled returns false when env is unset", () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    expect(isBreakerEnabled()).toBe(false);
  });

  it("checkBreaker always allows when env is unset", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const r = await checkBreaker(baseOpts, "fp-1");
    expect(r.allowed).toBe(true);
  });

  it("recordBreaker is a no-op when env is unset", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const r = await recordBreaker(baseOpts, {
      ok: false,
      context: { fingerprint: "fp", now: Date.now() },
    });
    expect(r.circuitOpened).toBe(false);
  });
});

describe("withBreaker wrapper (deps injected)", () => {
  function makeReq(): NextRequest {
    return new Request("http://localhost/test", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4", "user-agent": "vitest" },
    }) as unknown as NextRequest;
  }

  it("passes through to handler when check allows", async () => {
    const handler: WithBreakerHandler = async () => new Response("ok", { status: 200 });
    const wrapped = withBreaker(baseOpts, handler, {
      check: async () => ({ allowed: true, context: { fingerprint: "x", now: 1 } }),
      record: async () => ({ circuitOpened: false, newOpenUntil: 0 }),
    });
    const r = await wrapped(makeReq(), { fingerprint: "x", now: 1 });
    expect(r.status).toBe(200);
    expect(await r.text()).toBe("ok");
  });

  it("returns 429 + degraded JSON on rate_limit", async () => {
    const handler: WithBreakerHandler = async () => new Response("should not run", { status: 200 });
    const wrapped = withBreaker(baseOpts, handler, {
      check: async () => ({ allowed: false, reason: "rate_limit", resetAt: Date.now() + 60_000 }),
      record: async () => ({ circuitOpened: false, newOpenUntil: 0 }),
    });
    const r = await wrapped(makeReq(), { fingerprint: "x", now: 1 });
    expect(r.status).toBe(429);
    const body = await r.json();
    expect(body.ok).toBe(false);
    expect(body.reason).toBe("rate_limit");
    expect(r.headers.get("X-Breaker-Reason")).toBe("rate_limit");
  });

  it("returns 429 + degraded JSON on spend_cap", async () => {
    const handler: WithBreakerHandler = async () => new Response("nope", { status: 200 });
    const wrapped = withBreaker(baseOpts, handler, {
      check: async () => ({
        allowed: false,
        reason: "spend_cap",
        resetAt: Date.now() + 86_400_000,
        used: 101,
        cap: 100,
      }),
      record: async () => ({ circuitOpened: false, newOpenUntil: 0 }),
    });
    const r = await wrapped(makeReq(), { fingerprint: "x", now: 1 });
    expect(r.status).toBe(429);
    const body = await r.json();
    expect(body.reason).toBe("spend_cap");
  });

  it("returns 503 + degraded JSON on circuit_open", async () => {
    const handler: WithBreakerHandler = async () => new Response("nope", { status: 200 });
    const wrapped = withBreaker(baseOpts, handler, {
      check: async () => ({ allowed: false, reason: "circuit_open", resetAt: Date.now() + 30_000 }),
      record: async () => ({ circuitOpened: false, newOpenUntil: 0 }),
    });
    const r = await wrapped(makeReq(), { fingerprint: "x", now: 1 });
    expect(r.status).toBe(503);
    const body = await r.json();
    expect(body.reason).toBe("circuit_open");
    expect(r.headers.get("X-Breaker-Reason")).toBe("circuit_open");
  });

  it("records ok=false for 5xx responses and ok=true otherwise", async () => {
    const calls: Array<{ ok: boolean; context: BreakerContext }> = [];
    const ctx: BreakerContext = { fingerprint: "x", now: 1 };
    const recordDeps = {
      check: async (): Promise<CheckResult> => ({ allowed: true, context: ctx }),
      record: async (_opts: BreakerOptions, input: { ok: boolean; context: BreakerContext }) => {
        calls.push(input);
        return { circuitOpened: false, newOpenUntil: 0 };
      },
    };

    const failing = withBreaker(
      baseOpts,
      async () => new Response("oops", { status: 502 }),
      recordDeps,
    );
    await failing(makeReq(), ctx);
    expect(calls.at(-1)?.ok).toBe(false);

    const success = withBreaker(
      baseOpts,
      async () => new Response("ok", { status: 200 }),
      recordDeps,
    );
    await success(makeReq(), ctx);
    expect(calls.at(-1)?.ok).toBe(true);

    const clientErr = withBreaker(
      baseOpts,
      async () => new Response("bad", { status: 400 }),
      recordDeps,
    );
    await clientErr(makeReq(), ctx);
    expect(calls.at(-1)?.ok).toBe(true);
  });

  it("does not call the handler when check denies", async () => {
    let called = false;
    const handler: WithBreakerHandler = async () => {
      called = true;
      return new Response("ok", { status: 200 });
    };
    const wrapped = withBreaker(baseOpts, handler, {
      check: async () => ({ allowed: false, reason: "circuit_open", resetAt: Date.now() + 30_000 }),
      record: async () => ({ circuitOpened: false, newOpenUntil: 0 }),
    });
    await wrapped(makeReq(), { fingerprint: "x", now: 1 });
    expect(called).toBe(false);
  });
});

describe("degradedResponse", () => {
  it("returns 500 when called with an allowed outcome (defensive)", () => {
    const r = degradedResponse({ allowed: true, context: { fingerprint: "x", now: 1 } }, baseOpts);
    expect(r.status).toBe(500);
  });

  it("sets Retry-After header for circuit_open", () => {
    const resetAt = Date.now() + 30_000;
    const r = degradedResponse({ allowed: false, reason: "circuit_open", resetAt }, baseOpts);
    expect(r.headers.get("Retry-After")).toBeTruthy();
    expect(Number(r.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
});
