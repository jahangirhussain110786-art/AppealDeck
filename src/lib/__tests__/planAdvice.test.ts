import { describe, expect, it } from "vitest";
import { planAdvice } from "../planAdvice";

/**
 * "For your case" on the purchase screen (23 Oct 2026): says what each plan covers for the notice the
 * seller already read. It must follow the case, name the credit only where it exists, and never
 * predict what Amazon will do.
 */
const sent = {
  id: "s1",
  at: "2026-10-01T00:00:00Z",
  revision: 1,
  protocol: "documents" as const,
  text: "x",
  receipt: "",
  attachments: [],
};
const reply = { id: "r1", at: "2026-10-02T00:00:00Z", text: "t", applied: false };
const w = (protocol: string, extra: Record<string, unknown> = {}) =>
  ({ protocol, submissions: [], replies: [], ...extra }) as never;

describe("planAdvice", () => {
  it("says One Response covers a document request, and names the credited upgrade where it exists", () => {
    const a = planAdvice(w("documents"), { upgrade: true });
    expect(a?.fits).toBe("single");
    expect(a?.text).toContain("one set of records");
    expect(a?.text).toContain("$150");
    expect(a?.text).toContain("$99 taken off");
  });

  it("does not promise a credit where the upgrade is not configured", () => {
    const a = planAdvice(w("questionnaire"), { upgrade: false });
    expect(a?.fits).toBe("single");
    expect(a?.text).not.toContain("$150");
    expect(a?.text).toContain("the Appeal Pass covers the next response");
  });

  it("points an appeal (a Plan of Action) to the Appeal Pass", () => {
    const a = planAdvice(w("operational"), { upgrade: true });
    expect(a?.fits).toBe("case");
    expect(a?.text).toContain("covers every round");
  });

  it("says round two is the Appeal Pass's once Amazon has replied or a response is out", () => {
    for (const extra of [{ replies: [reply] }, { submissions: [sent] }]) {
      const a = planAdvice(w("documents", extra), { upgrade: true });
      expect(a?.fits).toBe("case");
      expect(a?.text).toContain("round two");
    }
  });

  it("says nothing for a case that gets no drafted response, or no case", () => {
    expect(planAdvice(w("verification"), { upgrade: true })).toBeNull();
    expect(planAdvice(w("clarification"), { upgrade: true })).toBeNull();
    expect(planAdvice(null, { upgrade: true })).toBeNull();
  });

  // 26 Oct 2026: the same predicate checkout and compose refuse on. A case that needs professional
  // help gets no plan recommendation, because no plan is sold for it.
  it("says nothing for a case that D6 sends to professional help", () => {
    expect(
      planAdvice(
        w("documents", {
          notice: "We found you submitted forged invoices. Upload your records.",
        }),
        { upgrade: true },
      ),
    ).toBeNull();
    expect(
      planAdvice(
        w("documents", {
          notice: "Please provide the supplier invoice.",
          replies: [{ ...reply, text: "The documents you provided were falsified." }],
        }),
        { upgrade: true },
      ),
    ).toBeNull();
  });

  it("never predicts an outcome or the number of rounds", () => {
    for (const p of ["documents", "questionnaire", "operational"]) {
      const text = planAdvice(w(p), { upgrade: true })!.text;
      expect(text).not.toMatch(
        /likely|usually|most cases|will be (approved|reinstated)|guarantee/i,
      );
    }
  });
});
