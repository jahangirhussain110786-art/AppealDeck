import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CHEERFUL,
  GUIDE,
  GUIDE_WIDTHS,
  SITUATIONS,
  SOBER_PREFIXES,
  guideFor,
  type GuideMood,
} from "../guide";

const MOODS: GuideMood[] = [
  "hello",
  "happy",
  "cheering",
  "explaining",
  "thinking",
  "calm",
  "confused",
  "idea",
  "reassure",
  "encourage",
];
const lines = [
  ...GUIDE.routes.map((r) => r.line),
  GUIDE.fallback.line,
  ...Object.values(SITUATIONS).map((s) => s.line),
];

describe("Dex, the guide in the corner", () => {
  it("says one short line per page: eight words at most, no exclamation marks", () => {
    for (const line of lines) {
      expect(line.split(/\s+/).length, line).toBeLessThanOrEqual(8);
      expect(line, line).not.toContain("!");
    }
  });

  it("never promises or predicts", () => {
    const banned =
      /\b(will win|guarantee|approved|reinstated|you will|we will win|sure to|certain)\b/i;
    for (const line of lines) expect(line, line).not.toMatch(banned);
  });

  it("is never cheerful where a seller may be reading bad news", () => {
    for (const route of GUIDE.routes) {
      const sober = SOBER_PREFIXES.some((p) => route.path === p || route.path.startsWith(`${p}/`));
      if (sober) expect(CHEERFUL, route.path).not.toContain(route.mood);
    }
    // and through the lookup the page uses, including a nested path
    for (const path of [
      "/case",
      "/case/anything",
      "/decode",
      "/dashboard",
      "/vault",
      "/billing",
      "/login",
    ]) {
      expect(CHEERFUL, path).not.toContain(guideFor(path)?.mood);
    }
  });

  it("matches the longest path, treats the home page as exact, and falls back politely", () => {
    expect(guideFor("/")?.line).toMatch(/Paste a notice/);
    expect(guideFor("/decode")?.mood).toBe("explaining");
    expect(guideFor("/guides/some-guide")?.line).toBe(guideFor("/guides")?.line);
    expect(guideFor("/an-unknown-page")).toEqual(GUIDE.fallback);
    expect(guideFor(null)?.line).toMatch(/Paste a notice/);
  });

  it("gives every real page its own line, so only a missing page says it cannot find one", () => {
    const pages = [
      "/",
      "/billing",
      "/case",
      "/dashboard",
      "/forgot-password",
      "/login",
      "/reset-password",
      "/signup",
      "/vault",
      "/changelog",
      "/check-invoice",
      "/decode",
      "/faq",
      "/for-professionals",
      "/guides",
      "/guides/some-guide",
      "/partners",
      "/how-we-test",
      "/pricing",
      "/privacy",
      "/refund",
      "/support",
      "/terms",
    ];
    for (const page of pages) expect(guideFor(page), page).not.toEqual(GUIDE.fallback);
  });

  it("has no guide on developer or API paths", () => {
    expect(guideFor("/dev/ui")).toBeNull();
    expect(guideFor("/api/health")).toBeNull();
  });

  it("states no fact: no digit, price, time or policy", () => {
    for (const line of lines) {
      expect(line, line).not.toMatch(/[0-9]|[$]|business days|\bfree\b|refund|deadline/i);
    }
  });

  it("has a picture, in every width, for every mood it uses", () => {
    const used = new Set<GuideMood>([
      ...GUIDE.routes.map((r) => r.mood),
      GUIDE.fallback.mood,
      ...Object.values(SITUATIONS).map((s) => s.mood),
    ]);
    for (const mood of used) {
      expect(MOODS).toContain(mood);
      for (const w of GUIDE_WIDTHS) {
        expect(
          existsSync(join(process.cwd(), "public", "mascot", `dex-${mood}-${w}.webp`)),
          `${mood} ${w}`,
        ).toBe(true);
      }
    }
  });

  describe("situations: what he says when the page tells him what the visitor is doing", () => {
    const entries = Object.entries(SITUATIONS) as Array<
      [string, (typeof SITUATIONS)[keyof typeof SITUATIONS]]
    >;
    // the page each kind of situation belongs to
    const PAGE: Record<string, string> = {
      home: "/",
      decode: "/decode",
      case: "/case",
      dashboard: "/dashboard",
      vault: "/vault",
      pricing: "/pricing",
    };
    // a crash or a lost connection can happen anywhere, so these belong to every page
    const ANYWHERE = ["error"];

    it("belongs to a page, and is found there", () => {
      for (const [key, entry] of entries) {
        const kind = key.split(".")[0] ?? "";
        const pages = ANYWHERE.includes(kind) ? Object.values(PAGE) : [PAGE[kind]];
        expect(pages[0], key).toBeTruthy();
        for (const page of pages)
          expect(guideFor(page!, key), key).toMatchObject({ mood: entry.mood, line: entry.line });
      }
    });

    it("is ignored on any other page, so a stale one can never leak", () => {
      for (const [key] of entries) {
        if (ANYWHERE.includes(key.split(".")[0] ?? "")) continue;
        const page = PAGE[key.split(".")[0] ?? ""];
        const elsewhere = page === "/faq" ? "/support" : "/faq";
        expect(guideFor(elsewhere, key), key).toEqual(guideFor(elsewhere));
      }
      expect(guideFor("/decode", "not.a.situation")).toEqual(guideFor("/decode"));
    });

    it("is never cheerful, and never hops, where a seller may be reading bad news", () => {
      for (const [key, entry] of entries) {
        const kind = key.split(".")[0] ?? "";
        // a crash or a lost connection can land on a sober page, so it must always be sober
        const page = ANYWHERE.includes(kind) ? "/case" : PAGE[kind]!;
        const sober = SOBER_PREFIXES.some((p) => page === p || page.startsWith(`${p}/`));
        if (!sober) continue;
        expect(CHEERFUL, key).not.toContain(entry.mood);
        expect("motion" in entry ? entry.motion : undefined, key).not.toBe("hop");
      }
    });

    it("covers the decoder, the case, the dashboard and the vault", () => {
      for (const key of [
        "decode.reading",
        "decode.result",
        "decode.scam",
        "decode.error",
        "case.new",
        "case.confirm",
        "case.ready",
        "case.gated",
        "dashboard.empty",
        "vault.empty",
        "error.crashed",
        "error.offline",
        "pricing.delayed",
      ]) {
        expect(key in SITUATIONS, key).toBe(true);
      }
    });
  });
});
