import { afterEach, describe, expect, it } from "vitest";
import { redisCredentials } from "../redisEnv";

const NAMES = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
] as const;
const saved = Object.fromEntries(NAMES.map((n) => [n, process.env[n]]));

afterEach(() => {
  for (const n of NAMES) {
    if (saved[n] === undefined) delete process.env[n];
    else process.env[n] = saved[n];
  }
});

function set(values: Partial<Record<(typeof NAMES)[number], string>>) {
  for (const n of NAMES) delete process.env[n];
  Object.assign(process.env, values);
}

describe("redisCredentials", () => {
  it("is null when nothing is configured", () => {
    set({});
    expect(redisCredentials()).toBeNull();
  });

  it("reads the Vercel Storage integration's KV_ names", () => {
    set({ KV_REST_API_URL: "https://kv.upstash.io", KV_REST_API_TOKEN: "kv-token" });
    expect(redisCredentials()).toEqual({ url: "https://kv.upstash.io", token: "kv-token" });
  });

  it("prefers the explicit UPSTASH_ names when both are present", () => {
    set({
      UPSTASH_REDIS_REST_URL: "https://explicit.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "explicit-token",
      KV_REST_API_URL: "https://kv.upstash.io",
      KV_REST_API_TOKEN: "kv-token",
    });
    expect(redisCredentials()).toEqual({
      url: "https://explicit.upstash.io",
      token: "explicit-token",
    });
  });

  it("is null when only half of a pair is set", () => {
    set({ KV_REST_API_URL: "https://kv.upstash.io" });
    expect(redisCredentials()).toBeNull();
  });
});
