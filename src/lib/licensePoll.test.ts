import { describe, expect, it, vi } from "vitest";
import { pollLicenseStatus, LicensePollTimeoutError } from "./licensePoll";

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe("pollLicenseStatus", () => {
  it("resolves as soon as the license is active", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status: "none", plan: null }))
      .mockResolvedValueOnce(jsonResponse({ status: "active", plan: "appeal-pass" }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await pollLicenseStatus({ fetchImpl, sleep, intervalMs: 10, timeoutMs: 1000 });

    expect(result).toEqual({ status: "active", plan: "appeal-pass" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("throws LicensePollTimeoutError when the deadline passes without activation", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ status: "none", plan: null }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      pollLicenseStatus({ fetchImpl, sleep, intervalMs: 10, timeoutMs: 25 }),
    ).rejects.toBeInstanceOf(LicensePollTimeoutError);
  });

  it("keeps polling past a non-ok response instead of throwing immediately", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, false))
      .mockResolvedValueOnce(jsonResponse({ status: "active", plan: "appeal-pass" }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await pollLicenseStatus({ fetchImpl, sleep, intervalMs: 10, timeoutMs: 1000 });
    expect(result.status).toBe("active");
  });
});
