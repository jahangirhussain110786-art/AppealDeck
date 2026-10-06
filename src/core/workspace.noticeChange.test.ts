import { describe, expect, it } from "vitest";
import { proposedRequirements, requirementsAfterNoticeChange } from "./workspace";

describe("requirementsAfterNoticeChange: stale Amazon quote", () => {
  const base = { formInstructions: "", revision: 1 };
  const first = {
    ...base,
    notice: "We could not verify authenticity. Please provide the supplier invoice for B0ABCDEFGH.",
  };
  const corrected = {
    ...base,
    notice: "We could not verify authenticity of your items. Submit your appeal.",
  };

  it("converts an untouched notice-sourced record the matrix still raises, dropping the old quote", () => {
    const old = proposedRequirements(first, "INAUTHENTIC");
    const supplier = old.find((r) => r.label === "Supplier invoice");
    expect(supplier?.source).toBe("notice");
    const fresh = proposedRequirements(corrected, "INAUTHENTIC");
    const after = requirementsAfterNoticeChange(old, fresh);
    const now = after.filter((r) => r.label === "Supplier invoice");
    expect(now).toHaveLength(1);
    expect(now[0]!.source).toBe("matrix");
    expect(now[0]!.sourceQuote).not.toContain("B0ABCDEFGH");
    expect(now[0]!.id).toBe(supplier!.id);
  });

  it("keeps the old requirement unchanged when the seller did work on it", () => {
    const old = proposedRequirements(first, "INAUTHENTIC").map((r) =>
      r.label === "Supplier invoice" ? { ...r, note: "Asked the supplier on Monday" } : r,
    );
    const fresh = proposedRequirements(corrected, "INAUTHENTIC");
    const after = requirementsAfterNoticeChange(old, fresh);
    const kept = after.find((r) => r.label === "Supplier invoice")!;
    expect(kept.source).toBe("notice");
    expect(kept.note).toBe("Asked the supplier on Monday");
  });
});
