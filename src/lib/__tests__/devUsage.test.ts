import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hasUnlimitedDevUsage,
  isUnlimitedDevUser,
  runWithDevUsage,
  withDevUsage,
} from "../devUsage";
import {
  rateLimitDecodeAi,
  rateLimitDocumentRead,
  rateLimitDraft,
  rateLimitWording,
} from "../ratelimit";
import { withAiBreaker } from "../llm/ai";
import { NextRequest } from "next/server";

const auth = vi.hoisted(() => ({ user: null as { id: string; email: string } | null }));
vi.mock("@/lib/auth", () => ({ getApiUser: async () => auth.user }));

const dev = { id: "verified-dev", email: "dev@example.test" };
const other = { id: "other", email: "seller@example.test" };

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("DEV_LOGIN_EMAIL", dev.email);
  vi.stubEnv("DEV_UNLIMITED_USAGE", "true");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  vi.stubEnv("KV_REST_API_URL", "");
  vi.stubEnv("KV_REST_API_TOKEN", "");
  auth.user = null;
});
afterEach(() => vi.unstubAllEnvs());

describe("unlimited local dev usage", () => {
  it("requires the configured signed-in account and explicit local opt-in", () => {
    expect(isUnlimitedDevUser(dev)).toBe(true);
    expect(isUnlimitedDevUser(other)).toBe(false);
    expect(isUnlimitedDevUser(null)).toBe(false);
    vi.stubEnv("DEV_UNLIMITED_USAGE", "false");
    expect(isUnlimitedDevUser(dev)).toBe(false);
    vi.stubEnv("DEV_UNLIMITED_USAGE", "true");
    vi.stubEnv("DEV_LOGIN_EMAIL", "");
    expect(isUnlimitedDevUser(dev)).toBe(false);
  });

  it("is always disabled in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isUnlimitedDevUser(dev)).toBe(false);
    expect(await runWithDevUsage(dev, async () => hasUnlimitedDevUsage())).toBe(false);
    expect((await rateLimitDraft(dev)).success).toBe(false);
  });

  it("isolates concurrent requests and clears the bypass afterwards", async () => {
    const result = await Promise.all(
      [dev, other, null].map((user) =>
        runWithDevUsage(user, async () => {
          await Promise.resolve();
          return hasUnlimitedDevUsage();
        }),
      ),
    );
    expect(result).toEqual([true, false, false]);
    expect(hasUnlimitedDevUsage()).toBe(false);
  });

  it("uses verified server auth, never request-supplied identity", async () => {
    const handler = withDevUsage(async (_claimedEmail: string) => hasUnlimitedDevUsage());
    expect(await handler(dev.email)).toBe(false);
    auth.user = other;
    expect(await handler(dev.email)).toBe(false);
    auth.user = dev;
    expect(await handler("ignored")).toBe(true);
  });

  it("carries the verified dev bypass through the cloud breaker wrapper", async () => {
    auth.user = dev;
    const handler = vi.fn(async () => {
      expect(hasUnlimitedDevUsage()).toBe(true);
      return new Response("ok");
    });
    const response = await withAiBreaker(handler)(
      new NextRequest("http://localhost/api/improve-wording"),
      { fingerprint: "test", now: 0 },
    );
    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(hasUnlimitedDevUsage()).toBe(false);
  });

  it("bypasses the document, draft, wording and anonymous-reading caps for dev only", async () => {
    for (const limit of [rateLimitDocumentRead, rateLimitDraft, rateLimitWording]) {
      expect((await limit(dev)).remaining).toBe(Number.MAX_SAFE_INTEGER);
      expect((await limit(other)).remaining).toBeLessThan(Number.MAX_SAFE_INTEGER);
    }
    expect(await runWithDevUsage(dev, () => rateLimitDecodeAi("test"))).toBe(true);
    expect(await runWithDevUsage(other, () => rateLimitDecodeAi("test"))).toBe(false);
  });
});
