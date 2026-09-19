import { describe, it, expect, vi, beforeEach } from "vitest";

let rows: Array<{
  status: string;
  plan: string | null;
  license_key: string | null;
  created_at: string;
  expires_at: string | null;
  case_id: string | null;
}> = [];
let queryError: { message: string } | null = null;
const rpcMock = vi.fn();

vi.mock("./supabase/server", () => ({
  get supabaseAdmin() {
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: rows, error: queryError }),
          }),
        }),
      }),
      rpc: (...args: unknown[]) => rpcMock(...args),
    };
  },
}));

import { fetchLicenseForUser, isLicenseActive, claimCasePass } from "./license";

beforeEach(() => {
  rows = [];
  queryError = null;
  rpcMock.mockReset();
});

describe("fetchLicenseForUser", () => {
  it("returns 'none' when there is no user id", async () => {
    expect(await fetchLicenseForUser(null)).toEqual({
      status: "none",
      plan: null,
      licenseKey: null,
    });
  });

  it("returns the active, unexpired license", async () => {
    rows = [
      {
        status: "active",
        plan: "appeal_pass",
        license_key: "key-1",
        created_at: "2026-09-01T00:00:00.000Z",
        expires_at: null,
        case_id: "case-1",
      },
    ];
    const summary = await fetchLicenseForUser("user-1");
    expect(summary.status).toBe("active");
    expect(summary.licenseKey).toBe("key-1");
  });

  it("reports an active row whose expires_at has already passed as 'none', not 'active'", async () => {
    rows = [
      {
        status: "active",
        plan: "appeal_pass",
        license_key: "key-1",
        created_at: "2026-01-01T00:00:00.000Z",
        expires_at: "2020-01-01T00:00:00.000Z",
        case_id: "case-1",
      },
    ];
    const summary = await fetchLicenseForUser("user-1");
    expect(summary.status).toBe("none");
  });

  it("prefers an active row over a newer but canceled row", async () => {
    rows = [
      {
        status: "canceled",
        plan: "appeal_pass",
        license_key: "key-newer",
        created_at: "2026-09-10T00:00:00.000Z",
        expires_at: null,
        case_id: "case-1",
      },
      {
        status: "active",
        plan: "appeal_pass",
        license_key: "key-older-active",
        created_at: "2026-09-01T00:00:00.000Z",
        expires_at: null,
        case_id: "case-1",
      },
    ];
    const summary = await fetchLicenseForUser("user-1");
    expect(summary.status).toBe("active");
    expect(summary.licenseKey).toBe("key-older-active");
  });

  it("falls back to the most recent row's own status when nothing is active", async () => {
    rows = [
      {
        status: "canceled",
        plan: "appeal_pass",
        license_key: "key-1",
        created_at: "2026-09-01T00:00:00.000Z",
        expires_at: null,
        case_id: "case-1",
      },
    ];
    const summary = await fetchLicenseForUser("user-1");
    expect(summary.status).toBe("canceled");
  });

  it("scopes eligibility to the given case, or a case-less (general) license", async () => {
    rows = [
      {
        status: "active",
        plan: "appeal_pass",
        license_key: "key-other-case",
        created_at: "2026-09-01T00:00:00.000Z",
        expires_at: null,
        case_id: "case-other",
      },
    ];
    const summary = await fetchLicenseForUser("user-1", "case-mine");
    expect(summary.status).toBe("none");
  });

  it("throws a clear error when the underlying query fails", async () => {
    queryError = { message: "connection reset" };
    await expect(fetchLicenseForUser("user-1")).rejects.toThrow("License lookup unavailable");
  });
});

describe("isLicenseActive", () => {
  it("is true only when the summary status is active", async () => {
    rows = [
      {
        status: "active",
        plan: null,
        license_key: null,
        created_at: "2026-09-01T00:00:00.000Z",
        expires_at: null,
        case_id: null,
      },
    ];
    expect(await isLicenseActive("user-1")).toBe(true);
  });

  it("is false with no license", async () => {
    expect(await isLicenseActive("user-1")).toBe(false);
  });
});

describe("claimCasePass", () => {
  it("returns true when the RPC confirms the claim", async () => {
    rpcMock.mockResolvedValue({ data: true, error: null });
    expect(await claimCasePass("user-1", "case-1")).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith("claim_case_pass", {
      p_user_id: "user-1",
      p_case_id: "case-1",
    });
  });

  it("returns false when the RPC denies the claim", async () => {
    rpcMock.mockResolvedValue({ data: false, error: null });
    expect(await claimCasePass("user-1", "case-1")).toBe(false);
  });

  it("throws a clear error when the RPC call fails", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "db error" } });
    await expect(claimCasePass("user-1", "case-1")).rejects.toThrow(
      "Case entitlement lookup unavailable",
    );
  });
});
