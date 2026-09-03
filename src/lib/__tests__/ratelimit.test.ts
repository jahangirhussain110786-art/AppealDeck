import { describe, expect, it } from "vitest";
import { isRateLimitEnabled, rateLimitCompose, rateLimitInterview } from "../ratelimit";

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

  it("rateLimitInterview allows request when env is unset (bypass)", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const r = await rateLimitInterview({ id: "test-user", email: null });
    expect(r.success).toBe(true);
    expect(r.limit).toBe(60);
    expect(r.remaining).toBe(60);
  });
});
