import { existsSync } from "node:fs";
import { POSE_FOR } from "@/components/dex3d/Dex3D";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHEERFUL, GUIDE, GUIDE_WIDTHS, SOBER_PREFIXES, guideFor, type GuideMood } from "../guide";

const MOODS: GuideMood[] = ["hello", "happy", "cheering", "explaining", "thinking", "calm"];
const lines = [...GUIDE.routes.map((r) => r.line), GUIDE.fallback.line];

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
    const used = new Set<GuideMood>([...GUIDE.routes.map((r) => r.mood), GUIDE.fallback.mood]);
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

  it("has a 3D pose for every mood", () => {
    for (const mood of MOODS) expect(POSE_FOR[mood], mood).toBeTruthy();
  });
});
