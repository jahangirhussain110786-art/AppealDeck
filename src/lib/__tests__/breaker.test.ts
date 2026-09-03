import { describe, expect, it } from "vitest";
import {
  checkBreaker,
  degradedResponse,
  isBreakerEnabled,
  recordBreaker,
  withBreaker,
  type BreakerContext,
  type BreakerOptions,
  type CheckResult,
  type WithBreakerHandler,
} from "../breaker";
import type { NextRequest } from "next/server";

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
