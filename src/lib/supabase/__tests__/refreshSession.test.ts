import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type SetAll = (
  cookies: { name: string; value: string; options?: Record<string, unknown> }[],
  headers: Record<string, string>,
) => void;

const created: { options: { cookies: { getAll: () => unknown; setAll: SetAll } } }[] = [];
const getSession = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: never) => {
    created.push({ options });
    return { auth: { getSession: () => getSession() } };
  },
}));

import { refreshSession } from "../refreshSession";

const req = (cookie?: string) =>
  new NextRequest("http://localhost:3000/dashboard", {
    headers: cookie ? { cookie } : {},
  });

beforeEach(() => {
  created.length = 0;
  getSession.mockReset();
  getSession.mockResolvedValue({ data: { session: null }, error: null });
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

describe("refreshSession", () => {
  it("does nothing for a visitor with no auth cookie", async () => {
    const res = await refreshSession(req("theme=dark; other=1"));
    expect(created).toHaveLength(0);
    expect(getSession).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("does nothing when Supabase is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    await refreshSession(req("sb-abc-auth-token=base64-xyz"));
    expect(created).toHaveLength(0);
  });

  it("looks at the session when the seller has an auth cookie, including a chunked one", async () => {
    await refreshSession(req("sb-abc-auth-token.0=aaa; sb-abc-auth-token.1=bbb"));
    expect(created).toHaveLength(1);
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it("ignores a cookie that only looks similar", async () => {
    await refreshSession(req("sb-abc-auth-token-code-verifier=x; sb_auth_token=y"));
    // The PKCE verifier is not a session: `-auth-token-code-verifier` must not count.
    expect(created).toHaveLength(0);
  });

  it("gives the browser the refreshed cookies, and the cache headers that keep them private", async () => {
    getSession.mockImplementation(async () => {
      // What the library does when it refreshes an expired token.
      created[0]!.options.cookies.setAll(
        [{ name: "sb-abc-auth-token", value: "base64-NEW", options: { path: "/", maxAge: 400 } }],
        { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0" },
      );
      return { data: { session: {} }, error: null };
    });

    const res = await refreshSession(req("sb-abc-auth-token=base64-OLD"));

    expect(res.headers.get("set-cookie")).toContain("sb-abc-auth-token=base64-NEW");
    expect(res.headers.get("cache-control")).toMatch(/no-store/);
  });

  it("forwards the refreshed cookies to the page being rendered, not only to the browser", async () => {
    const request = req("sb-abc-auth-token=base64-OLD");
    getSession.mockImplementation(async () => {
      created[0]!.options.cookies.setAll([{ name: "sb-abc-auth-token", value: "base64-NEW" }], {});
      return { data: { session: {} }, error: null };
    });

    await refreshSession(request);

    // Without this the page renders with the spent token even though the browser got the new one.
    expect(request.cookies.get("sb-abc-auth-token")?.value).toBe("base64-NEW");
  });

  it("clears the cookie when the library says the session is over", async () => {
    getSession.mockImplementation(async () => {
      created[0]!.options.cookies.setAll(
        [{ name: "sb-abc-auth-token", value: "", options: { maxAge: 0 } }],
        {},
      );
      return { data: { session: null }, error: null };
    });

    const res = await refreshSession(req("sb-abc-auth-token=base64-OLD"));

    expect(res.headers.get("set-cookie")).toMatch(/sb-abc-auth-token=;.*Max-Age=0/i);
  });

  it("never stops a page from loading when Supabase fails", async () => {
    getSession.mockRejectedValue(new Error("auth server unreachable"));
    const res = await refreshSession(req("sb-abc-auth-token=base64-OLD"));
    expect(res).toBeInstanceOf(Response);
    expect(res.status).toBe(200);
  });
});
