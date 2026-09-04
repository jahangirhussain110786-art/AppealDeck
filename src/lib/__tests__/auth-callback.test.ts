import { describe, expect, it, vi, beforeEach } from "vitest";

const exchangeCodeForSessionMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    auth: { exchangeCodeForSession: (...args: unknown[]) => exchangeCodeForSessionMock(...args) },
  }),
}));

import { GET } from "@/app/(app)/auth/callback/route";

function makeReq(url: string): Request {
  return new Request(url, { method: "GET" });
}

beforeEach(() => {
  exchangeCodeForSessionMock.mockReset();
  exchangeCodeForSessionMock.mockResolvedValue({ error: null });
});

describe("/auth/callback route", () => {
  it("redirects to / when no code and no type", async () => {
    const res = await GET(makeReq("http://localhost/auth/callback") as unknown as Request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/");
  });

  it("redirects to /reset-password when type=recovery", async () => {
    const res = await GET(
      makeReq("http://localhost/auth/callback?code=abc&type=recovery") as unknown as Request,
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/reset-password");
  });

  it("exchanges the code for a session when present", async () => {
    await GET(makeReq("http://localhost/auth/callback?code=abc123") as unknown as Request);
    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("abc123");
  });

  it("redirects to /login with error when exchange fails", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: { message: "bad code" } });
    const res = await GET(
      makeReq("http://localhost/auth/callback?code=bogus") as unknown as Request,
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/login?error=" + encodeURIComponent("bad code"),
    );
  });

  it("honors an explicit ?next= param when type is not recovery", async () => {
    const res = await GET(
      makeReq("http://localhost/auth/callback?code=abc&next=/case") as unknown as Request,
    );
    expect(res.headers.get("location")).toBe("http://localhost/case");
  });

  it("always routes type=recovery to /reset-password, ignoring ?next=", async () => {
    const res = await GET(
      makeReq(
        "http://localhost/auth/callback?code=abc&type=recovery&next=/case",
      ) as unknown as Request,
    );
    expect(res.headers.get("location")).toBe("http://localhost/reset-password");
  });
});
