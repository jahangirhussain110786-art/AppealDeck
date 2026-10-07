import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ admin: null as unknown, redis: null as unknown }));
vi.mock("@/lib/supabase/server", () => ({
  get supabaseAdmin() {
    return state.admin;
  },
}));
vi.mock("@/lib/redisEnv", () => ({ redisCredentials: () => state.redis }));

import { GET as health } from "../health/route";
import { GET as digest } from "../jobs/ops-digest/route";

const adminWith = (counts: Record<string, number>, fail = false) => ({
  from: (table: string) => {
    const result = { count: counts[table] ?? 0, error: fail ? { message: "x" } : null };
    const chain: Record<string, unknown> = {};
    for (const m of ["select", "is", "gte", "not", "lte", "limit"]) chain[m] = () => chain;
    chain.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
    return chain;
  },
});

beforeEach(() => {
  state.admin = adminWith({});
  state.redis = { url: "u", token: "t" };
  process.env.CRON_SECRET = "s3cret";
  delete process.env.OPS_ALERT_EMAIL;
});

describe("/api/health", () => {
  it("is 200 when the database answers and the limiter is configured, with no detail", async () => {
    const res = await health();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, database: true, limiter: true });
  });

  it("is 503 when either is missing", async () => {
    state.redis = null;
    expect((await health()).status).toBe(503);
    state.redis = { url: "u", token: "t" };
    state.admin = adminWith({}, true);
    expect((await health()).status).toBe(503);
  });
});

describe("/api/jobs/ops-digest", () => {
  const call = (token?: string) =>
    digest(
      new Request("http://x/api/jobs/ops-digest", {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      }) as never,
    );

  it("refuses without the cron secret", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("wrong")).status).toBe(401);
  });

  it("reports all clear without alerting", async () => {
    const body = await (await call("s3cret")).json();
    expect(body).toMatchObject({ ok: true, alerted: false, parkedPayments: 0 });
  });

  it("logs loudly and says so when something is parked and no address is set", async () => {
    state.admin = adminWith({ payment_events_unmatched: 1 });
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const body = await (await call("s3cret")).json();
    expect(body).toMatchObject({ ok: false, parkedPayments: 1, alerted: false });
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});
