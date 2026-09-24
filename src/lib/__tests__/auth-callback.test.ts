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
  it("redirects to /dashboard when no code and no type", async () => {
    const res = await GET(makeReq("http://localhost/auth/callback") as unknown as Request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
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

  /**
   * A reason code, never the provider's text (24 Sep 2026): /login shows only its own wording,
   * because text carried in a URL can be set by anyone who sends a seller a link.
   */
  it("redirects to /login with a reason code when exchange fails, not the provider's text", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: { message: "bad code" } });
    const res = await GET(
      makeReq("http://localhost/auth/callback?code=bogus") as unknown as Request,
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login?error=link_failed");
    expect(res.headers.get("location")).not.toContain("bad");
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

  it("blocks protocol-relative //evil.com redirect", async () => {
    const res = await GET(
      makeReq("http://localhost/auth/callback?code=abc&next=//evil.com") as unknown as Request,
    );
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("blocks absolute external URL redirect", async () => {
    const res = await GET(
      makeReq(
        "http://localhost/auth/callback?code=abc&next=https://evil.com",
      ) as unknown as Request,
    );
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("blocks @-prefixed redirect", async () => {
    const res = await GET(
      makeReq("http://localhost/auth/callback?code=abc&next=@evil.com") as unknown as Request,
    );
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("blocks dot-prefixed redirect", async () => {
    const res = await GET(
      makeReq("http://localhost/auth/callback?code=abc&next=.evil.com") as unknown as Request,
    );
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("threads a recovery ?continue= into /reset-password so the original destination survives", async () => {
    const res = await GET(
      makeReq(
        "http://localhost/auth/callback?code=abc&type=recovery&next=/reset-password&continue=/case%3Fview%3Dresponse",
      ) as unknown as Request,
    );
    expect(res.headers.get("location")).toBe(
      "http://localhost/reset-password?next=" + encodeURIComponent("/case?view=response"),
    );
  });

  it("ignores an unsafe ?continue= on recovery and falls back to plain /reset-password", async () => {
    const res = await GET(
      makeReq(
        "http://localhost/auth/callback?code=abc&type=recovery&continue=https://evil.com",
      ) as unknown as Request,
    );
    expect(res.headers.get("location")).toBe(
      "http://localhost/reset-password?next=" + encodeURIComponent("/dashboard"),
    );
  });

  it("allows same-origin /vault redirect", async () => {
    const res = await GET(
      makeReq("http://localhost/auth/callback?code=abc&next=/vault") as unknown as Request,
    );
    expect(res.headers.get("location")).toBe("http://localhost/vault");
  });
});
