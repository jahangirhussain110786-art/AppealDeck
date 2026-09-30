import { describe, expect, it } from "vitest";
import {
  isRateLimitEnabled,
  rateLimitCompose,
  rateLimitReminders,
  tooManyRequestsResponse,
  waitPhrase,
} from "../ratelimit";

describe("the refusal says how long to wait", () => {
  const body = async (reset: number) =>
    (await tooManyRequestsResponse({ success: false, limit: 20, remaining: 0, reset }).json())
      .error as string;

  it("keeps 'try again in a minute' for a per-minute limit", async () => {
    expect(await body(Date.now() + 40_000)).toMatch(/try again in a minute/);
  });

  it("does not tell a seller past a daily cap to try again in a minute", async () => {
    // Document reading allows 20 a day. The old message sent a seller who had used them back to be
    // refused again, for up to a day, each time believing it was a passing hiccup.
    const message = await body(Date.now() + 5 * 3_600_000);
    expect(message).not.toMatch(/minute/);
    expect(message).toMatch(/resets in about 5 hours/);
  });

  it("still sends Retry-After in seconds", () => {
    const res = tooManyRequestsResponse({
      success: false,
      limit: 20,
      remaining: 0,
      reset: Date.now() + 3_600_000,
    });
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(3_500);
  });

  it("phrases waits in minutes, then hours", () => {
    expect(waitPhrase(300)).toBe("about 5 minutes");
    expect(waitPhrase(130)).toBe("about 2 minutes");
    expect(waitPhrase(3_600 * 2)).toBe("about 2 hours");
    expect(waitPhrase(3_600 * 1.2)).toBe("about 72 minutes");
    expect(waitPhrase(3_600 * 20)).toBe("about 20 hours");
  });
});

describe("reminders have a limiter of their own", () => {
  it("allows a seller who moves a date many times, unlike the ten-a-day outcome cap", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const r = await rateLimitReminders({ id: "test-user", email: null });
    expect(r.success).toBe(true);
    expect(r.limit).toBe(60);
  });
});

describe("rate limit (no Upstash configured)", () => {
  it("isRateLimitEnabled returns false when env is unset", () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    expect(isRateLimitEnabled()).toBe(false);
  });

  it("rateLimitCompose allows request when env is unset (bypass)", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const r = await rateLimitCompose({ id: "test-user", email: null });
    expect(r.success).toBe(true);
    expect(r.limit).toBe(30);
    expect(r.remaining).toBe(30);
  });
});
