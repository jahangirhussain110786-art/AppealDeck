import { describe, expect, it, vi, beforeEach } from "vitest";

const getApiUserMock = vi.fn();
const fetchLicenseByEmailMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/license", () => ({
  fetchLicenseByEmail: (...args: unknown[]) => fetchLicenseByEmailMock(...args),
}));

import { GET } from "../license/status/route";

beforeEach(() => {
  getApiUserMock.mockReset();
  fetchLicenseByEmailMock.mockReset();
});

describe("GET /api/license/status", () => {
  it("returns 401 JSON when unauthenticated", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns the typed license summary when signed in", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    fetchLicenseByEmailMock.mockResolvedValue({
      status: "active",
      plan: "appeal-pass",
      licenseKey: "key-1",
    });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body).toEqual({ status: "active", plan: "appeal-pass" });
  });

  it("returns status none when signed in with no license", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    fetchLicenseByEmailMock.mockResolvedValue({ status: "none", plan: null, licenseKey: null });
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ status: "none", plan: null });
  });
});
