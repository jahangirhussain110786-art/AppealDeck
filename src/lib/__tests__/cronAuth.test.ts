import { afterEach, describe, expect, it } from "vitest";
import { isCronAuthorized } from "../cronAuth";

const req = (authorization?: string) => ({
  headers: { get: (name: string) => (name === "authorization" ? (authorization ?? null) : null) },
});

describe("isCronAuthorized", () => {
  const original = process.env.CRON_SECRET;
  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  });

  it("fails closed when no secret is configured", () => {
    delete process.env.CRON_SECRET;
    expect(isCronAuthorized(req("Bearer undefined"))).toBe(false);
    expect(isCronAuthorized(req("Bearer "))).toBe(false);
  });

  it("accepts exactly the configured bearer secret", () => {
    process.env.CRON_SECRET = "s3cret-value";
    expect(isCronAuthorized(req("Bearer s3cret-value"))).toBe(true);
  });

  it("rejects a missing, wrong, shorter or longer header", () => {
    process.env.CRON_SECRET = "s3cret-value";
    expect(isCronAuthorized(req())).toBe(false);
    expect(isCronAuthorized(req("Bearer s3cret-valuf"))).toBe(false);
    expect(isCronAuthorized(req("Bearer s3cret"))).toBe(false);
    expect(isCronAuthorized(req("Bearer s3cret-value-extra"))).toBe(false);
    expect(isCronAuthorized(req("s3cret-value"))).toBe(false);
  });
});
