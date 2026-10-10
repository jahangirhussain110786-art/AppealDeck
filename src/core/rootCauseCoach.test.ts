import { describe, expect, it } from "vitest";
import { VIOLATION_KINDS } from "./violationKinds";
import { assembleRootCause, assessRootCause, coachQuestions } from "./rootCauseCoach";

describe("coachQuestions", () => {
  it("asks five questions for every kind, the last one optional, with an example each", () => {
    for (const kind of VIOLATION_KINDS) {
      const q = coachQuestions(kind);
      expect(
        q.map((x) => x.key),
        kind,
      ).toEqual(["failure", "scope", "step", "why", "found"]);
      expect(q.filter((x) => x.optional).map((x) => x.key)).toEqual(["found"]);
      for (const item of q) {
        expect(item.label.length, `${kind} ${item.key}`).toBeGreaterThan(10);
        expect(item.example.length).toBeGreaterThan(10);
      }
    }
  });

  it("words the first question for the notice, and falls back to a plain one", () => {
    expect(coachQuestions("PERFORMANCE_METRIC")[0]!.label).toMatch(/measure was missed/);
    expect(coachQuestions("INAUTHENTIC")[0]!.label).toMatch(/where did those units come from/);
    expect(coachQuestions("UNKNOWN")[0]!.label).toBe("What is the one thing that went wrong?");
  });

  it("never promises or predicts anything in its questions, hints or examples", () => {
    const all = VIOLATION_KINDS.flatMap((k) => coachQuestions(k)).flatMap((q) => [
      q.label,
      q.hint,
      q.example,
    ]);
    for (const text of all)
      expect(text).not.toMatch(/\b(?:guarantee|will be approved|will win|likely)\b/i);
  });
});

describe("assembleRootCause", () => {
  it("puts the answers together in order, exactly as written, leaving out the empty ones", () => {
    const text = assembleRootCause({
      failure: "Returned items went back on sale as new",
      scope: "  B0EXAMPLE1, 12 to 28 Aug 2026.  ",
      step: "",
      why: "We had no rule to open returns first!",
    });
    expect(text).toBe(
      "Returned items went back on sale as new. B0EXAMPLE1, 12 to 28 Aug 2026. We had no rule to open returns first!",
    );
  });

  it("adds no words of its own", () => {
    expect(assembleRootCause({})).toBe("");
    expect(assembleRootCause({ failure: "x" })).toBe("x.");
  });
});

describe("assessRootCause", () => {
  const ONE =
    "On 14 Aug 2026 our packer shipped 12 returned units of B0EXAMPLE1 as new because no one was assigned to open returns.";

  it("is quiet about a clear single cause with specifics", () => {
    expect(assessRootCause(ONE)).toEqual({
      multipleCauses: false,
      matched: [],
      missingSpecifics: false,
    });
  });

  it("does not judge a half-typed answer", () => {
    expect(assessRootCause("It was a few things.")).toEqual({
      multipleCauses: false,
      matched: [],
      missingSpecifics: false,
    });
  });

  it("notices a list of factors and says which words gave it away", () => {
    const r = assessRootCause(
      "There were several factors behind this: our supplier changed packaging on 3 Mar 2026 and our checks were not updated.",
    );
    expect(r.multipleCauses).toBe(true);
    expect(r.matched).toEqual(["several factors"]);
    expect(
      assessRootCause(
        `The contributing factors on 5 Aug 2026 were a late supplier and a new packer.`,
      ).matched,
    ).toEqual(["contributing factors"]);
  });

  it("notices firstly/secondly and bulleted lists of causes", () => {
    expect(
      assessRootCause(
        "Firstly, the supplier shipped late on 2 Aug 2026. Secondly, our packer was new on 3 Aug.",
      ).multipleCauses,
    ).toBe(true);
    expect(
      assessRootCause(
        "The causes on 2 Aug 2026:\n- supplier was late\n- packer was new\n- no checklist in place",
      ).matched,
    ).toEqual(["3 list items"]);
  });

  it("a single 'first' in a sentence is not a list", () => {
    expect(
      assessRootCause(
        "The first thing that broke on 4 Aug 2026 was our returns check, which nobody owned.",
      ).multipleCauses,
    ).toBe(false);
  });

  it("flags a long answer with no date, number or ASIN in it", () => {
    const r = assessRootCause(
      "We made a mistake with how returned items were handled and did not notice in time.",
    );
    expect(r.missingSpecifics).toBe(true);
    expect(r.multipleCauses).toBe(false);
  });
});
