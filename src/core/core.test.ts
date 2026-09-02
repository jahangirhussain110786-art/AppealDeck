import { describe, it, expect } from "vitest";
import { parseNotice } from "./noticeParser";
import { classifyStage1 } from "./classifier";
import { computeDeadlines, isIndefiniteHold } from "./deadlinesModel";
import { runDecode } from "./index";
import { FIXTURES } from "./fixtures";
import { KIND_GUIDANCE, guidanceFor } from "./guidance";

describe("noticeParser", () => {
  it("extracts the legacy 17-day pattern and ambiguity flags", () => {
    const p = parseNotice(FIXTURES.find((f) => f.id === "inauthentic-2-legacy")!.raw);
    expect(p.legacySeventeenDay).toBe(true);
    expect(p.statedWindowDays).toBe(17);
    expect(p.kindHints).toContain("INAUTHENTIC_DOCUMENTS");
  });

  it("flags an ambiguous window when no number is stated", () => {
    const p = parseNotice(FIXTURES.find((f) => f.id === "inauthentic-1")!.raw);
    expect(p.statedWindowDays).toBeNull();
    expect(p.windowAmbiguous).toBe(true);
  });

  it("detects funds language", () => {
    const p = parseNotice(FIXTURES.find((f) => f.id === "funds-1")!.raw);
    expect(p.mentionsFunds).toBe(true);
    expect(p.mentionsFundsAppeal).toBe(true);
  });
});

describe("classifier stage-1", () => {
  it("maps parser hints to kinds deterministically", () => {
    for (const f of FIXTURES) {
      const c = classifyStage1(parseNotice(f.raw));
      expect(c.kind).toBe(f.expected.kind);
      expect(c.severityGated).toBe(f.expected.severityGated);
    }
  });

  it("routes an unparseable notice to LLM-needed / UNKNOWN", () => {
    const c = classifyStage1(
      parseNotice(FIXTURES.find((f) => f.id === "adversarial-2-vague")!.raw),
    );
    expect(c.kind).toBe("UNKNOWN");
    expect(c.confidence).toBe("llm-needed");
  });
});

describe("deadlinesModel (AM-03)", () => {
  it("uses stated days for a clear window", () => {
    const p = parseNotice(FIXTURES.find((f) => f.id === "inauthentic-2-legacy")!.raw);
    const ds = computeDeadlines({
      noticeReceivedAt: new Date("2026-09-01"),
      parsed: p,
      kind: "INAUTHENTIC_DOCUMENTS",
    });
    const aw = ds.find((d) => d.kind === "appeal_window");
    expect(aw?.dueAt?.toISOString().slice(0, 10)).toBe("2026-09-18");
  });

  it("flags ambiguity instead of inventing a date", () => {
    const p = parseNotice(FIXTURES.find((f) => f.id === "inauthentic-1")!.raw);
    const ds = computeDeadlines({
      noticeReceivedAt: new Date("2026-09-01"),
      parsed: p,
      kind: "INAUTHENTIC_DOCUMENTS",
    });
    expect(ds.find((d) => d.kind === "appeal_window")?.dueAt).toBeNull();
  });

  it("computes the 60/90-day funds model from deactivation", () => {
    const p = parseNotice(FIXTURES.find((f) => f.id === "funds-1")!.raw);
    const ds = computeDeadlines({
      noticeReceivedAt: new Date("2026-09-01"),
      deactivatedAt: new Date("2026-09-01"),
      parsed: p,
      kind: "FUNDS",
    });
    expect(
      ds
        .find((d) => d.kind === "funds_appeal_eligible")
        ?.dueAt?.toISOString()
        .slice(0, 10),
    ).toBe("2026-10-31");
    expect(
      ds
        .find((d) => d.kind === "funds_review")
        ?.dueAt?.toISOString()
        .slice(0, 10),
    ).toBe("2026-11-30");
  });

  it("treats the severity-gated inauthentic class as an indefinite hold (no countdown)", () => {
    expect(isIndefiniteHold("INAUTHENTIC_DOCUMENTS")).toBe(true);
  });

  it("treats non-fraud classes as NOT indefinite holds", () => {
    expect(isIndefiniteHold("POLICY")).toBe(false);
    expect(isIndefiniteHold("FUNDS")).toBe(false);
    expect(isIndefiniteHold("RELATED_ACCOUNT")).toBe(false);
  });
});

describe("decode pipeline (runDecode)", () => {
  it("composes parse -> classify -> deadlines in one call for a funds notice", () => {
    const raw = FIXTURES.find((f) => f.id === "funds-1")!.raw;
    const res = runDecode(raw, {
      noticeReceivedAt: new Date("2026-09-01"),
      deactivatedAt: new Date("2026-09-01"),
    });
    expect(res.classification.kind).toBe("FUNDS");
    expect(res.deadlines.some((d) => d.kind === "funds_appeal_eligible")).toBe(true);
    expect(res.deadlines.some((d) => d.kind === "funds_review")).toBe(true);
  });

  it("routes severity-gated inauthentic straight to an indefinite hold (no appeal-window date)", () => {
    const raw = FIXTURES.find((f) => f.id === "inauthentic-3")!.raw;
    const res = runDecode(raw, { noticeReceivedAt: new Date("2026-09-01") });
    expect(res.classification.severityGated).toBe(true);
    expect(isIndefiniteHold(res.classification.kind)).toBe(true);
    expect(res.deadlines.find((d) => d.kind === "appeal_window")?.dueAt).toBeNull();
  });
});

describe("guidance (KIND_GUIDANCE)", () => {
  it("provides actionable guidance for every violation kind", () => {
    for (const kind of Object.keys(KIND_GUIDANCE) as Array<keyof typeof KIND_GUIDANCE>) {
      const g = KIND_GUIDANCE[kind];
      expect(g.title.length).toBeGreaterThan(0);
      expect(g.summary.length).toBeGreaterThan(0);
      expect(g.whatToDo.length).toBeGreaterThan(0);
    }
  });

  it("flags the severity-gated inauthentic class with a severity note", () => {
    expect(guidanceFor("INAUTHENTIC_DOCUMENTS").severityNote).toBeDefined();
    expect(guidanceFor("POLICY").severityNote).toBeUndefined();
  });
});
