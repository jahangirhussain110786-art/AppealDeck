import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * 24 Sep 2026, found because CI had been red for days. `requireUser` checked the return path
 * against `process.env.NEXT_PUBLIC_APP_URL ?? ""`, and the deployment guide says to leave that
 * variable unset on a single host. With an empty origin `safeNext` rejects every path, so a
 * signed-out seller sent to sign in from /billing came back to /dashboard. Locally the variable
 * happened to be set, which is why only CI saw it.
 */
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => null }));

const saved = {
  app: process.env.NEXT_PUBLIC_APP_URL,
  site: process.env.NEXT_PUBLIC_SITE_URL,
};

beforeEach(() => {
  redirect.mockClear();
  vi.resetModules();
});

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = saved.app;
  process.env.NEXT_PUBLIC_SITE_URL = saved.site;
  if (saved.app === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  if (saved.site === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe("requireUser", () => {
  it("keeps the page the seller asked for when the app URL is left unset, as deployed", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.vercel.app";
    const { requireUser } = await import("../auth");
    await expect(requireUser("/billing")).rejects.toThrow("REDIRECT:/login?next=%2Fbilling");
  });

  it("still refuses a return path that leaves the site", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const { requireUser } = await import("../auth");
    await expect(requireUser("//evil.example")).rejects.toThrow(
      "REDIRECT:/login?next=%2Fdashboard",
    );
  });
});
