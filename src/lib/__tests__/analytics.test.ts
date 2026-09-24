import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FUNNEL_EVENTS, trackFunnelEvent } from "../analytics";

/**
 * 24 Sep 2026: `docs/CURRENT-STATE.md` listed the funnel events as untested. A missing event is
 * the one analytics defect that cannot be repaired afterwards — the data it should have counted is
 * simply never collected — and one of them (`intake_started`) had been defined and fired from
 * nowhere for twelve days. These pin the names and that every one has a place that fires it.
 */
function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) sources(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) && !full.includes("__tests__"))
      out.push(full);
  }
  return out;
}

describe("funnel events", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("use the spec's names verbatim", () => {
    expect(Object.values(FUNNEL_EVENTS)).toEqual([
      "decoder_session",
      "decode_completed",
      "intake_started",
      "checkout_opened",
      "pass_purchased",
      "outcome_reported",
      "gated_screen_shown",
      "poa_generated",
    ]);
  });

  it("are each fired from somewhere in the app", () => {
    const code = sources(path.join(process.cwd(), "src"))
      .filter((f) => !f.endsWith(path.join("lib", "analytics.ts")))
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    for (const key of Object.keys(FUNNEL_EVENTS)) {
      expect(code, key).toMatch(new RegExp(`trackFunnelEvent\\(\\s*FUNNEL_EVENTS\\.${key}\\b`));
    }
  });

  it("sends the event and its properties to Plausible", () => {
    const plausible = vi.fn();
    vi.stubGlobal("window", { plausible });
    trackFunnelEvent(FUNNEL_EVENTS.decodeCompleted, { kind: "POLICY" });
    expect(plausible).toHaveBeenCalledWith("decode_completed", { props: { kind: "POLICY" } });
  });

  it("does nothing, and never throws, when analytics is not loaded or fails", () => {
    expect(() => trackFunnelEvent(FUNNEL_EVENTS.intakeStarted)).not.toThrow();
    vi.stubGlobal("window", {
      plausible: () => {
        throw new Error("blocked");
      },
    });
    expect(() => trackFunnelEvent(FUNNEL_EVENTS.intakeStarted)).not.toThrow();
  });
});
