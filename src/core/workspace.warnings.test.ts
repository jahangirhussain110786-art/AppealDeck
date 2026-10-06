import { describe, expect, it } from "vitest";
import { computeReplyDelta, newWorkspace, proposedRequirements } from "./workspace";
import { documentWorkspace } from "./workspace.fixture";
import { markSentWaiting } from "./workspace";
import { STORES } from "../content/stores";

describe("A7: a warning raises no records", () => {
  const warning = "Your account is at risk. Review your metrics in Account Health.";
  const removal = "Your listing for ASIN B08N5WRWNW has been removed.";

  it("raises nothing for an at-risk banner, even with a violation kind to union in", () => {
    const w = { ...newWorkspace(), notice: warning };
    expect(proposedRequirements(w)).toEqual([]);
    expect(proposedRequirements(w, "POLICY")).toEqual([]);
    expect(proposedRequirements(w, "INAUTHENTIC_DOCUMENTS")).toEqual([]);
  });

  it("raises nothing for a one-line listing removal", () => {
    const w = { ...newWorkspace(), notice: removal };
    expect(proposedRequirements(w, "POLICY")).toEqual([]);
  });

  it("still raises records for a suspension notice", () => {
    const w = {
      ...newWorkspace(),
      notice:
        "Your selling account has been suspended. To appeal, provide a supplier invoice for the affected ASIN.",
    };
    expect(proposedRequirements(w, "INAUTHENTIC_DOCUMENTS").length).toBeGreaterThan(0);
  });
});

describe("A7: a reply that says the decision is final raises nothing", () => {
  it("carries the reviewed record and adds none", () => {
    const w = documentWorkspace();
    w.replies.push({
      id: "reply-final",
      at: new Date().toISOString(),
      text: "We have reviewed your appeal. This decision is final. Please provide the supplier invoice again if you wish to be reconsidered.",
      applied: false,
    });
    const delta = computeReplyDelta(w, "reply-final")!;
    expect(delta.items.map((i) => i.change)).toEqual(["carried"]);
  });

  it("still reopens a record when an ordinary refusal asks for it again", () => {
    const w = documentWorkspace();
    w.replies.push({
      id: "reply-more",
      at: new Date().toISOString(),
      text: "We are unable to reinstate your account at this time. Please provide the supplier invoice for the affected product.",
      applied: false,
    });
    const delta = computeReplyDelta(w, "reply-more")!;
    expect(delta.items.some((i) => i.change === "reopened")).toBe(true);
  });
});

describe("A5: marking an appeal as already sent", () => {
  it("sets SUBMITTED, writes one history line and records no submission", () => {
    const w = documentWorkspace();
    const out = markSentWaiting({ state: "INTAKE" as const, workspace: w });
    expect(out.state).toBe("SUBMITTED");
    expect(out.workspace.history.at(-1)!.message).toBe(STORES.markedSentWaiting);
    expect(out.workspace.submissions).toHaveLength(0);
  });
});
