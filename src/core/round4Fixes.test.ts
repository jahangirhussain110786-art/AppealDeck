/**
 * 7 Oct 2026 review of the workspace core: each case is a state a seller can really reach.
 */
import { describe, expect, it } from "vitest";
import { requirementsAfterNoticeChange, type Requirement } from "./workspace";
import { formatDate, formatDateTime } from "@/lib/format";

const req = (over: Partial<Requirement>): Requirement => ({
  id: over.id ?? "r1",
  label: "Letter of authorization",
  sourceQuote: "Please provide a letter of authorization.",
  status: "needed",
  note: "",
  source: "notice",
  sourceRevision: 1,
  ...over,
});

describe("a record from an earlier round when the current request does not repeat it", () => {
  it("is kept, because Amazon not asking again does not withdraw the ask", () => {
    const fresh = [req({ id: "f1", label: "Supplier invoice", evidenceKind: "supplier_invoice" })];
    const kept = requirementsAfterNoticeChange(
      [req({ id: "old", sourceRevision: 1 })],
      fresh,
      [],
      2,
    );
    expect(kept.map((r) => r.id)).toContain("old");
  });

  it("is still dropped when it came from the same request that was corrected", () => {
    const fresh = [req({ id: "f1", label: "Supplier invoice", evidenceKind: "supplier_invoice" })];
    const kept = requirementsAfterNoticeChange(
      [req({ id: "old", sourceRevision: 2 })],
      fresh,
      [],
      2,
    );
    expect(kept.map((r) => r.id)).not.toContain("old");
  });
});

describe("dates that cannot be read", () => {
  it("print as blank rather than NaN", () => {
    expect(formatDate("not a date")).toBe("");
    expect(formatDateTime("not a date")).toBe("");
  });
});
