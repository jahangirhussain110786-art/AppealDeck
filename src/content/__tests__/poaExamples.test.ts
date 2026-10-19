import { describe, expect, it } from "vitest";
import { WORKSPACE } from "../workspace";
import { VIOLATION_KINDS } from "@/core/violationKinds";

describe("per-kind Plan of Action examples (19 Oct 2026)", () => {
  const entries = Object.entries(WORKSPACE.responseFields.poaByKind);

  it("only names real case kinds", () => {
    for (const [kind] of entries) expect(VIOLATION_KINDS).toContain(kind);
  });

  it("gives every box an example in the shape of an answer, not a claim about the case", () => {
    for (const [, ex] of entries)
      for (const text of Object.values(ex)) expect(text.startsWith("For example: ")).toBe(true);
  });

  it("does not show the returns example to an authenticity or performance appeal", () => {
    for (const kind of ["INAUTHENTIC", "PERFORMANCE_METRIC"]) {
      const ex = WORKSPACE.responseFields.poaByKind[kind]!;
      expect(Object.values(ex).join(" ")).not.toMatch(/returned items|returns/i);
    }
  });
});
