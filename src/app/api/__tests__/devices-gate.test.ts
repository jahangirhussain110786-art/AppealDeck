import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const listDevicesMock = vi.fn();
const deriveFingerprintMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: { from: () => ({}) },
}));

vi.mock("@/lib/devices", () => ({
  listDevices: (...args: unknown[]) => listDevicesMock(...args),
  revokeDevice: vi.fn(),
  deriveFingerprintFromRequest: (...args: unknown[]) => deriveFingerprintMock(...args),
}));

import { GET } from "../devices/route";

function makeReq(): NextRequest {
  return new Request("http://localhost:3000/api/devices", {
    method: "GET",
  }) as unknown as NextRequest;
}

beforeEach(() => {
  getApiUserMock.mockReset();
  listDevicesMock.mockReset();
  deriveFingerprintMock.mockReset();
  deriveFingerprintMock.mockResolvedValue("fp-current");
});

describe("/api/devices GET gates", () => {
  it("returns 401 JSON when unauthenticated", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 with devices, cap, and currentDeviceId", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    listDevicesMock.mockResolvedValue([
      {
        id: "d1",
        license_id: "l1",
        user_id: "u1",
        device_fingerprint: "fp-current",
        label: "Chrome",
        user_agent: "Chrome",
        first_seen_at: "2026-09-01T00:00:00Z",
        last_seen_at: "2026-09-07T00:00:00Z",
        revoked_at: null,
      },
      {
        id: "d2",
        license_id: "l1",
        user_id: "u1",
        device_fingerprint: "fp-other",
        label: "Safari",
        user_agent: "Safari",
        first_seen_at: "2026-09-02T00:00:00Z",
        last_seen_at: "2026-09-05T00:00:00Z",
        revoked_at: null,
      },
    ]);
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cap).toBe(5);
    expect(body.currentDeviceId).toBe("d1");
    expect(body.devices).toHaveLength(2);
    expect(body.devices[0].device_fingerprint).toBeUndefined();
    expect(body.devices[1].device_fingerprint).toBeUndefined();
  });

  it("returns currentDeviceId null when no device matches the fingerprint", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    listDevicesMock.mockResolvedValue([
      {
        id: "d1",
        license_id: "l1",
        user_id: "u1",
        device_fingerprint: "fp-other",
        label: "Chrome",
        user_agent: "Chrome",
        first_seen_at: "2026-09-01T00:00:00Z",
        last_seen_at: "2026-09-07T00:00:00Z",
        revoked_at: null,
      },
    ]);
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.currentDeviceId).toBeNull();
  });
});
