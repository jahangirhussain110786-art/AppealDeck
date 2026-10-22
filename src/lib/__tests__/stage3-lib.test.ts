import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The library code behind the professional products and the renewal (22 Oct 2026): the renewal window,
 * who is told their Account Pass is ending (and never twice), what a professional account may spend,
 * the review's reading allowance, and how the Billing page waits for a purchase to land.
 */
const DAY = 86_400_000;

// ---------- supabase stand-in -------------------------------------------------------------------
type Result = { data?: unknown; error?: unknown };
const tables: Record<string, Result> = {};
const rpcResult: { value: Result } = { value: { data: null, error: null } };
const inserted: { table: string; row: unknown }[] = [];
const deleted: { table: string; filters: Record<string, unknown> }[] = [];
let insertError: { code?: string } | null = null;

function chain(table: string): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  const done = () => Promise.resolve(tables[table] ?? { data: [], error: null });
  const c: Record<string, unknown> = {};
  for (const m of ["select", "in", "gt", "is", "limit", "order"]) c[m] = () => c;
  c.eq = (k: string, v: unknown) => {
    filters[k] = v;
    return c;
  };
  c.maybeSingle = () => Promise.resolve(tables[table] ?? { data: null, error: null });
  c.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => done().then(res, rej);
  c.insert = (row: unknown) => {
    inserted.push({ table, row });
    return Promise.resolve({ error: insertError });
  };
  c.delete = () => {
    const d = { table, filters };
    deleted.push(d);
    return c;
  };
  return c;
}

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: {
    from: (t: string) => chain(t),
    rpc: () => Promise.resolve(rpcResult.value),
  },
}));

// ---------- redis stand-in ----------------------------------------------------------------------
const store = new Map<string, number>();
let redisDown = false;
vi.mock("@upstash/redis", () => ({
  Redis: class {
    async get(k: string) {
      if (redisDown) throw new Error("down");
      return store.get(k) ?? null;
    }
    async incr(k: string) {
      if (redisDown) throw new Error("down");
      store.set(k, (store.get(k) ?? 0) + 1);
      return store.get(k)!;
    }
    async expire() {
      return 1;
    }
  },
}));

import {
  coverHasEnded,
  RENEWAL_CLOSES_DAYS_AFTER,
  RENEWAL_OPENS_DAYS_BEFORE,
  renewalClosesOn,
  renewalOpensOn,
  renewalWindow,
} from "../renewal";
import { endingSoon, deliverAccountPassNotices, NOTICE_DAYS_BEFORE } from "../accountPassNotices";
import { fetchProStatus, fetchProSubscription, spendCaseCredit } from "../license";
import { pollLicenseStatus } from "../licensePoll";
import { REVIEW_READS_PER_CASE, recordReviewRead, reviewReadsLeft } from "../ratelimit";

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k];
  rpcResult.value = { data: null, error: null };
  inserted.length = 0;
  deleted.length = 0;
  insertError = null;
  store.clear();
  redisDown = false;
});
afterEach(() => vi.unstubAllEnvs());

describe("when an Account Pass may be renewed", () => {
  const end = Date.UTC(2027, 9, 22);
  const iso = new Date(end).toISOString();

  it("opens 60 days before the cover ends and closes 30 days after", () => {
    expect(RENEWAL_OPENS_DAYS_BEFORE).toBe(60);
    expect(RENEWAL_CLOSES_DAYS_AFTER).toBe(30);
    expect(renewalWindow(iso, end - 61 * DAY)).toBe("early");
    expect(renewalWindow(iso, end - 60 * DAY)).toBe("open");
    expect(renewalWindow(iso, end + 30 * DAY)).toBe("open");
    expect(renewalWindow(iso, end + 31 * DAY)).toBe("closed");
  });

  it("says the cover has ended on the end instant and after, never before, and never for a date it cannot read", () => {
    expect(coverHasEnded(iso, end - 1)).toBe(false);
    expect(coverHasEnded(iso, end)).toBe(true);
    expect(coverHasEnded(iso, end + DAY)).toBe(true);
    expect(coverHasEnded("not a date", end)).toBe(false);
  });

  it("treats a date it cannot read as closed rather than guessing", () => {
    expect(renewalWindow("not a date")).toBe("closed");
  });

  it("names the day it opens and the last day, as the Billing page shows them", () => {
    expect(renewalOpensOn(iso)).toBe(new Date(end - 60 * DAY).toISOString());
    expect(renewalClosesOn(iso)).toBe(new Date(end + 30 * DAY).toISOString());
  });
});

describe("who is told their Account Pass is ending", () => {
  const now = Date.UTC(2027, 9, 1);
  const at = (days: number) => new Date(now + days * DAY).toISOString();

  it("picks an account whose cover ends within 30 days, and only then", () => {
    const rows = [
      { user_id: "soon", email: "a@x.com", expires_at: at(10) },
      { user_id: "far", email: "b@x.com", expires_at: at(NOTICE_DAYS_BEFORE + 1) },
      { user_id: "edge", email: "c@x.com", expires_at: at(NOTICE_DAYS_BEFORE) },
      { user_id: "past", email: "d@x.com", expires_at: at(-1) },
    ];
    expect(endingSoon(rows, now).map((a) => a.userId)).toEqual(["soon", "edge"]);
  });

  it("uses the latest end, so a renewal silences the warning about the first end date", () => {
    const rows = [
      { user_id: "u", email: "a@x.com", expires_at: at(5) },
      { user_id: "u", email: "a@x.com", expires_at: at(5 + 365) },
    ];
    expect(endingSoon(rows, now)).toEqual([]);
  });

  it("skips an account with no email or no end date", () => {
    expect(
      endingSoon(
        [
          { user_id: "u", email: null, expires_at: at(5) },
          { user_id: "v", email: "v@x.com", expires_at: null },
          { user_id: null, email: "w@x.com", expires_at: at(5) },
        ],
        now,
      ),
    ).toEqual([]);
  });
});

describe("delivering the ending notices", () => {
  const soon = new Date(Date.now() + 5 * DAY).toISOString();
  const rows = () => {
    tables.licenses = {
      data: [{ user_id: "u1", email: "a@x.com", expires_at: soon }],
      error: null,
    };
  };

  it("writes the notice first, then sends once with a key that is the same on a retry", async () => {
    rows();
    const send = vi.fn().mockResolvedValue(undefined);
    const out = await deliverAccountPassNotices(send);
    expect(out).toEqual({ sent: 1, skipped: 0, failed: 0 });
    expect(inserted[0]).toMatchObject({ table: "account_pass_notices" });
    expect(send.mock.calls[0]![0].idempotencyKey).toBe(
      `account-pass-ending/u1/${soon.slice(0, 10)}`,
    );
    expect(send.mock.calls[0]![0].to).toBe("a@x.com");
  });

  it("does not send a second time for an end date already told", async () => {
    rows();
    insertError = { code: "23505" };
    const send = vi.fn();
    expect(await deliverAccountPassNotices(send)).toEqual({ sent: 0, skipped: 1, failed: 0 });
    expect(send).not.toHaveBeenCalled();
  });

  it("removes the notice when the email fails, so tomorrow tries again", async () => {
    rows();
    const send = vi.fn().mockRejectedValue(new Error("mail down"));
    expect(await deliverAccountPassNotices(send)).toEqual({ sent: 0, skipped: 0, failed: 1 });
    expect(deleted).toHaveLength(1);
    expect(deleted[0]).toMatchObject({
      table: "account_pass_notices",
      filters: { user_id: "u1", expires_on: soon.slice(0, 10) },
    });
  });

  it("counts a notice it could not even record as failed, and does not send", async () => {
    rows();
    insertError = { code: "XX000" };
    const send = vi.fn();
    expect(await deliverAccountPassNotices(send)).toEqual({ sent: 0, skipped: 0, failed: 1 });
    expect(send).not.toHaveBeenCalled();
  });

  it("throws when the queue cannot be read, so the job answers 503", async () => {
    tables.licenses = { data: null, error: { message: "down" } };
    await expect(deliverAccountPassNotices(vi.fn())).rejects.toThrow();
  });
});

describe("a professional account's standing", () => {
  const future = new Date(Date.now() + 40 * DAY).toISOString();
  const sooner = new Date(Date.now() + 10 * DAY).toISOString();
  const past = new Date(Date.now() - DAY).toISOString();

  it("counts only credits not refunded, not ended and not used, and names the first to end", async () => {
    tables.pro_accounts = { data: { status: "verified" }, error: null };
    tables.case_credits = {
      data: [
        { granted: 10, used: 4, expires_at: future, canceled_at: null },
        { granted: 3, used: 0, expires_at: sooner, canceled_at: null },
        { granted: 5, used: 5, expires_at: future, canceled_at: null },
        { granted: 5, used: 0, expires_at: past, canceled_at: null },
        { granted: 5, used: 0, expires_at: future, canceled_at: past },
      ],
      error: null,
    };
    tables.licenses = { data: [{ status: "active" }], error: null };
    expect(await fetchProStatus("u1")).toEqual({
      verified: true,
      creditsLeft: 9,
      creditsEndAt: sooner,
      proPlanActive: true,
    });
  });

  it("is not verified until the founder has said so, and a suspended account is not", async () => {
    tables.pro_accounts = { data: { status: "suspended" }, error: null };
    tables.case_credits = { data: [], error: null };
    tables.licenses = { data: [], error: null };
    expect(await fetchProStatus("u1")).toMatchObject({ verified: false, creditsLeft: 0 });
    tables.pro_accounts = { data: null, error: null };
    expect((await fetchProStatus("u1")).verified).toBe(false);
  });

  it("throws, rather than say 'no credits', when a lookup fails", async () => {
    tables.pro_accounts = { data: null, error: { message: "x" } };
    tables.case_credits = { data: [], error: null };
    tables.licenses = { data: [], error: null };
    await expect(fetchProStatus("u1")).rejects.toThrow();
  });

  it("spends a credit only on the database's say-so, and refuses an answer it does not know", async () => {
    for (const answer of ["used", "covered", "already_used", "not_verified", "no_credit"]) {
      rpcResult.value = { data: answer, error: null };
      expect(await spendCaseCredit("u1", "c1")).toBe(answer);
    }
    rpcResult.value = { data: "something new", error: null };
    await expect(spendCaseCredit("u1", "c1")).rejects.toThrow();
    rpcResult.value = { data: null, error: { message: "x" } };
    await expect(spendCaseCredit("u1", "c1")).rejects.toThrow();
  });

  it("gives the customer and subscription of an active Pro plan, and null without both", async () => {
    tables.licenses = {
      data: { provider_customer_id: "ctm_1", provider_subscription_id: "sub_1" },
      error: null,
    };
    expect(await fetchProSubscription("u1")).toEqual({
      customerId: "ctm_1",
      subscriptionId: "sub_1",
    });
    tables.licenses = {
      data: { provider_customer_id: "ctm_1", provider_subscription_id: null },
      error: null,
    };
    expect(await fetchProSubscription("u1")).toBeNull();
    tables.licenses = { data: null, error: null };
    expect(await fetchProSubscription("u1")).toBeNull();
  });
});

describe("the document review's reading allowance", () => {
  const user = { id: "u-review", email: "seller@example.com" };

  it("is the full five where no counter is configured outside production", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(await reviewReadsLeft(user, "c1")).toEqual({ left: REVIEW_READS_PER_CASE });
  });

  it("refuses in production when the counter is missing, because an unlimited review costs money", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("KV_REST_API_TOKEN", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(await reviewReadsLeft(user, "c1")).toEqual({ left: 0, unavailable: true });
  });

  it("counts down per case, only for readings recorded, and never goes below zero", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://r.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    expect((await reviewReadsLeft(user, "c1")).left).toBe(5);
    for (let i = 0; i < 3; i++) await recordReviewRead(user, "c1");
    expect((await reviewReadsLeft(user, "c1")).left).toBe(2);
    expect((await reviewReadsLeft(user, "c2")).left).toBe(5);
    for (let i = 0; i < 5; i++) await recordReviewRead(user, "c1");
    expect((await reviewReadsLeft(user, "c1")).left).toBe(0);
  });

  it("says unavailable when the counter errors, and a failed count never throws", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://r.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    redisDown = true;
    expect(await reviewReadsLeft(user, "c1")).toEqual({ left: 0, unavailable: true });
    await expect(recordReviewRead(user, "c1")).resolves.toBeUndefined();
  });
});

describe("waiting for a purchase to land", () => {
  const fast = { intervalMs: 1, timeoutMs: 1000, sleep: () => Promise.resolve() };

  it("asks about the case's documents, not the Pass, after a document review", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "active", plan: "document_review" }), {
        status: 200,
      }),
    );
    await pollLicenseStatus({ ...fast, caseId: "c 1", forDocuments: true, fetchImpl });
    expect(fetchImpl.mock.calls[0]![0]).toBe("/api/license/status?caseId=c%201&for=documents");
  });

  it("asks about the Pass for an ordinary purchase, and for the account when there is no case", async () => {
    const ok = () =>
      new Response(JSON.stringify({ status: "active", plan: "appeal_pass" }), { status: 200 });
    const a = vi.fn().mockResolvedValue(ok());
    await pollLicenseStatus({ ...fast, caseId: "c1", fetchImpl: a });
    expect(a.mock.calls[0]![0]).toBe("/api/license/status?caseId=c1");
    const b = vi.fn().mockResolvedValue(ok());
    await pollLicenseStatus({ ...fast, fetchImpl: b });
    expect(b.mock.calls[0]![0]).toBe("/api/license/status");
  });

  it("keeps asking after a dropped request and stops when the seller leaves", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "pending" }), { status: 200 }))
      .mockResolvedValue(
        new Response(JSON.stringify({ status: "active", plan: "pro_plan" }), { status: 200 }),
      );
    expect((await pollLicenseStatus({ ...fast, fetchImpl })).plan).toBe("pro_plan");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const controller = new AbortController();
    controller.abort();
    await expect(
      pollLicenseStatus({ ...fast, fetchImpl, signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
