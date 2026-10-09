import { describe, it, expect } from "vitest";
import { composePoa, critiquePoa } from "./composer";
import { isLowLexicalDiversity, isNarrativeTextSufficient } from "./readiness";
import { newWorkspace, type Workspace } from "./workspace";
import { computeDraftStrength } from "@/lib/draftStrength";

const NOTICE = "Your selling account has been deactivated. Submit a Plan of Action to appeal.";

function operational(parts: {
  explanation: string;
  correctiveActions: string;
  preventiveMeasures: string;
  notice?: string;
}): Workspace {
  return {
    ...newWorkspace(),
    notice: parts.notice ?? NOTICE,
    protocol: "operational",
    confirmed: true,
    requirementsConfirmed: true,
    explanation: parts.explanation,
    correctiveActions: parts.correctiveActions,
    correctiveActionsAttested: { at: "2026-10-01T00:00:00.000Z" },
    preventiveMeasures: parts.preventiveMeasures,
  };
}

function review(w: Workspace) {
  const data = { kind: "UNKNOWN" as const, evidenceSlots: {}, actionItems: [], workspace: w };
  const draft = composePoa(data);
  const critique = critiquePoa(draft, data);
  return {
    draft,
    codes: critique.findings.map((f) => f.code),
    strength: computeDraftStrength(draft.mode, critique.findings),
    critique,
  };
}

const GOOD = operational({
  explanation:
    "Our listing check compared the supplier invoice to the wrong ASIN, so three units were listed as new when they were refurbished.",
  correctiveActions:
    "On 3 Sep 2026 I removed the three listings, refunded the affected orders and retrained my two packers on condition grading.",
  preventiveMeasures:
    "Every inbound carton is now checked against the supplier invoice by a second person before it is listed; I audit 20 listings each Monday.",
});

describe("draft quality: first-person singular", () => {
  it("keeps a genuinely specific draft strong", () => {
    const r = review(GOOD);
    expect(r.draft.mode.mode).toBe("full-draft");
    expect(r.strength).toBe("strong");
  });

  it("flags 'I will' / 'I plan to' / 'I intend to' as future tense", () => {
    const r = review(
      operational({
        ...GOOD,
        preventiveMeasures:
          "I will hire a second packer and I plan to audit every shipment going forward. I intend to review all carriers.",
      }),
    );
    expect(r.codes).toContain("FUTURE_TENSE_LANGUAGE");
    expect(r.strength).not.toBe("strong");
  });

  it("flags a first-person 'going to' and 'my team will'", () => {
    for (const text of [
      "I am going to add a second check on every carton that arrives.",
      "My team will compare every invoice to the listing before it goes live.",
    ]) {
      const r = review(operational({ ...GOOD, preventiveMeasures: text }));
      expect(r.codes).toContain("FUTURE_TENSE_LANGUAGE");
    }
  });

  it("flags first-person blame shifting and 'I did not know'", () => {
    for (const text of [
      "My supplier caused this when they changed the product without telling me at all.",
      "I was not aware of the change in the supplier's packaging until a customer complained.",
      "I did not know about the problem until Amazon told me about the complaints.",
      "It was out of my control because the carrier relabelled the cartons in transit.",
      "This was not my fault, the listing tool changed the category on its own.",
    ]) {
      const r = review(operational({ ...GOOD, explanation: text }));
      expect(r.codes, text).toContain("BLAME_SHIFTING_LANGUAGE");
      expect(r.strength).not.toBe("strong");
    }
  });

  it("flags 'guaranteed' and 'guarantees' as promise language", () => {
    for (const text of [
      "I guaranteed that this will never happen again after the checks I added on 3 Sep 2026.",
      "This guarantees the problem is solved after the checks added on 3 Sep 2026 each Monday.",
    ]) {
      const r = review(operational({ ...GOOD, preventiveMeasures: text }));
      expect(r.codes, text).toContain("BANNED_GUARANTEE");
      expect(r.strength).toBe("weak");
    }
  });

  it("warns on an absolute 'never happen again' promise", () => {
    const r = review(
      operational({
        ...GOOD,
        preventiveMeasures:
          "The second-person invoice check, run each Monday on 20 listings, means this will never happen again.",
      }),
    );
    expect(r.codes).toContain("ABSOLUTE_PROMISE");
    expect(r.strength).not.toBe("strong");
  });

  it("does not flag an ordinary 'ensure this does not happen again' sentence", () => {
    const r = review(
      operational({
        ...GOOD,
        preventiveMeasures:
          "To ensure this does not recur, a second person checks every carton against the invoice, and I audit 20 listings each Monday.",
      }),
    );
    expect(r.codes).not.toContain("ABSOLUTE_PROMISE");
  });
});

describe("draft quality: thin or padded narratives", () => {
  it("rates the vague three-section draft below strong", () => {
    const r = review(
      operational({
        explanation: "I did not know about the problem until Amazon told me last week.",
        correctiveActions:
          "I have made some changes to how I do things and they are better than before.",
        preventiveMeasures:
          "I will make sure this does not happen again by being more careful in future.",
      }),
    );
    expect(r.strength).not.toBe("strong");
    expect(r.codes).toContain("NO_CONCRETE_ACTION");
  });

  it("flags the same sentence used in every section", () => {
    const same =
      "We reviewed our listing process and made it better so that the problem goes away for good.";
    const r = review(
      operational({ explanation: same, correctiveActions: same, preventiveMeasures: same }),
    );
    expect(r.codes).toContain("DUPLICATE_SECTIONS");
    expect(r.strength).not.toBe("strong");
  });

  it("flags gibberish padding", () => {
    const pad = "word ".repeat(50).trim();
    const r = review(
      operational({ ...GOOD, explanation: pad, correctiveActions: GOOD.correctiveActions }),
    );
    expect(r.codes).toContain("REPETITIVE_TEXT");
    expect(r.strength).not.toBe("strong");
  });

  it("flags the notice pasted back as the answer", () => {
    const notice =
      "Your selling account has been deactivated because we found that your listings violate our product condition policy and customers reported items that did not match the description.";
    const r = review(operational({ ...GOOD, notice, explanation: notice }));
    expect(r.codes).toContain("NOTICE_ECHO");
    expect(r.strength).not.toBe("strong");
  });

  it("never produces an error from these rules, and never mentions Amazon's decision", () => {
    const same = "We made it better.";
    const r = review(
      operational({ explanation: same, correctiveActions: same, preventiveMeasures: same }),
    );
    const mine = r.critique.findings.filter((f) =>
      [
        "DUPLICATE_SECTIONS",
        "REPETITIVE_TEXT",
        "NOTICE_ECHO",
        "NO_CONCRETE_ACTION",
        "ABSOLUTE_PROMISE",
      ].includes(f.code),
    );
    for (const f of mine) {
      expect(f.severity).toBe("warning");
      expect(f.message).not.toMatch(/approv|likel|chance|odds|reinstat/i);
    }
  });
});

describe("narrative sufficiency: lexical diversity", () => {
  it("rejects a long text of one repeated word", () => {
    expect(isLowLexicalDiversity("word ".repeat(50))).toBe(true);
    expect(isNarrativeTextSufficient("word ".repeat(50))).toBe(false);
  });

  it("accepts ordinary prose", () => {
    expect(
      isNarrativeTextSufficient(
        "Our listing verification process did not check that the supplier invoice matched the ASIN before inventory was sent.",
      ),
    ).toBe(true);
  });
});

describe("template wording (9 Oct 2026)", () => {
  const base = {
    explanation:
      "Our packer was on leave from 10 to 19 August 2026 and nobody else knew the label printer, so 14 of 610 orders shipped late.",
    correctiveActions:
      "We shipped the 14 late orders by 21 August 2026 and trained Bilal on the label printer on 2 September 2026.",
    preventiveMeasures:
      "We check unshipped orders at 9am and 4pm every day, and two people can now print labels.",
  };
  const codes = (w: Workspace) => review(w).codes;

  it("warns on the filler phrases an AI draft reaches for", () => {
    const found = codes(
      operational({
        ...base,
        preventiveMeasures: `${base.preventiveMeasures} Going forward, we will do this to ensure coverage and to prevent this from happening again.`,
      }),
    );
    expect(found).toContain("FILLER_PHRASES");
  });

  it("is silent on specific wording, and on a phrase inside a longer word", () => {
    expect(codes(operational(base))).not.toContain("FILLER_PHRASES");
    expect(
      codes(
        operational({
          ...base,
          preventiveMeasures: `${base.preventiveMeasures} The forward-looking sensor was replaced on 3 Sep 2026.`,
        }),
      ),
    ).not.toContain("FILLER_PHRASES");
  });

  it("is a warning, never an error", () => {
    const w = operational({
      ...base,
      correctiveActions: `${base.correctiveActions} We take this seriously.`,
    });
    const data = { kind: "UNKNOWN" as const, evidenceSlots: {}, actionItems: [], workspace: w };
    const finding = critiquePoa(composePoa(data), data).findings.find(
      (f) => f.code === "FILLER_PHRASES",
    );
    expect(finding?.severity).toBe("warning");
  });
});
