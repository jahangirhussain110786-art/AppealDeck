import { describe, expect, it } from "vitest";
import { composeWorkspace, newWorkspace, proposedRequirements, writtenPartGaps } from "./workspace";
import { createCaseFile } from "./caseFile";
import { computeDraftStrength } from "../lib/draftStrength";
import { critiquePoa } from "./composer";

const NOTICE =
  "We removed the listing because customers complained about item condition (Used Sold as New). Submit a plan of action. You may appeal within 30 days.";
const GOOD = {
  explanation:
    "We listed returned items as new. Customer returns were put back into our new-condition stock without anyone opening the packaging, so four customers received opened items in September.",
  correctiveActions:
    "Finished: on 30 September we removed all 12 affected listings and relisted the returned units as Used - Like New.",
  preventiveMeasures:
    "Our warehouse lead opens and inspects every return before it can go back on sale, and records the result in a returns log.",
};

function workspace(over: Partial<ReturnType<typeof newWorkspace>> = {}) {
  const w = {
    ...newWorkspace(),
    notice: NOTICE,
    confirmed: true,
    protocol: "operational" as const,
  };
  const withReqs = { ...w, requirements: proposedRequirements(w, "POLICY") };
  return { ...withReqs, ...over };
}

function compose(w: ReturnType<typeof workspace>) {
  const file = { ...createCaseFile("POLICY"), workspace: w };
  return composeWorkspace(file as Parameters<typeof composeWorkspace>[0], 1);
}

describe("a draft's gap reason says whether the writing is what is unfinished", () => {
  it("is 'evidence' when the answers are complete and only a record is missing", () => {
    const w = workspace({ ...GOOD, correctiveActionsAttested: { at: "2026-10-07T00:00:00.000Z" } });
    expect(writtenPartGaps(w)).toEqual([]);
    const draft = compose(w);
    expect(draft.mode.mode).toBe("gap-draft");
    expect(draft.mode.gapReason).toBe("evidence");
    // ...so the writing is not called thin because a file is not linked yet.
    const data = { kind: "UNKNOWN" as const, evidenceSlots: {}, actionItems: [], workspace: w };
    expect(computeDraftStrength(draft.mode, critiquePoa(draft, data).findings)).toBe("strong");
  });

  it("is 'narrative' when only the answers are missing, and 'both' when a record is missing too", () => {
    const empty = workspace({ requirementsConfirmed: true, requirements: [] });
    const onlyWriting = compose(empty);
    expect(writtenPartGaps(empty).length).toBeGreaterThan(0);
    expect(onlyWriting.mode.gapReason).toBe("narrative");

    const both = compose(workspace());
    expect(both.mode.gapReason).toBe("both");
    expect(computeDraftStrength(both.mode, [])).toBe("weak");
  });

  it("has no gap reason when nothing is unfinished", () => {
    const w = workspace({ ...GOOD, requirements: [], requirementsConfirmed: true });
    const draft = compose({ ...w, correctiveActionsAttested: { at: "2026-10-07T00:00:00.000Z" } });
    if (draft.mode.mode === "full-draft") expect(draft.mode.gapReason).toBeUndefined();
  });
});
