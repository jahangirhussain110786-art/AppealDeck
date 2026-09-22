import { describe, expect, it } from "vitest";
import { detectIssues, hasMultipleIssues } from "./noticeIssues";
import { classifyStage1 } from "./classifier";
import { parseNotice } from "./noticeParser";
import { newWorkspace, proposedIssues, workspaceGaps, type Workspace } from "./workspace";

const TWO_ISSUE_NOTICE = [
  "Your Amazon seller account has been deactivated.",
  "We could not verify the authenticity of the invoices you supplied for the affected products.",
  "Separately, your detail page policy violation for ASIN B0EXAMPLE1 remains unresolved.",
].join("\n");

describe("detectIssues", () => {
  it("keeps every issue a notice raises, not only the one the case routes on", () => {
    const issues = detectIssues(TWO_ISSUE_NOTICE);
    expect(issues.map((i) => i.kind)).toEqual(["INAUTHENTIC_DOCUMENTS", "LISTING"]);
  });

  it("agrees with the classifier about which issue comes first", () => {
    const issues = detectIssues(TWO_ISSUE_NOTICE);
    // Nothing about existing routing may shift underneath a seller: the primary issue must remain
    // exactly the kind the case already routes on.
    expect(issues[0]!.kind).toBe(classifyStage1(parseNotice(TWO_ISSUE_NOTICE)).kind);
  });

  it("quotes the sentence that raised each issue", () => {
    for (const issue of detectIssues(TWO_ISSUE_NOTICE)) {
      expect(TWO_ISSUE_NOTICE).toContain(issue.sourceQuote);
    }
  });

  it("reports nothing it cannot show a source for", () => {
    for (const issue of detectIssues(TWO_ISSUE_NOTICE)) {
      expect(issue.sourceQuote.trim().length).toBeGreaterThan(0);
    }
  });

  it("reads the response form as well as the notice", () => {
    const issues = detectIssues(
      "Your account has been deactivated.",
      "Confirm your identity verification and upload the requested restricted product approval.",
    );
    expect(issues.map((i) => i.kind)).toContain("VERIFICATION");
    expect(issues.map((i) => i.kind)).toContain("RESTRICTED_PRODUCT");
  });

  it("leaves a single-issue notice as a single issue", () => {
    const issues = detectIssues(
      "Your Amazon seller account has been deactivated. Please provide the supplier invoice for the affected product.",
    );
    expect(hasMultipleIssues(issues)).toBe(false);
  });

  it("names each kind at most once, however often the notice repeats it", () => {
    const issues = detectIssues(
      [
        "We could not verify the authenticity of your invoices.",
        "The invoices you supplied are not authentic.",
        "Your documentation could not be verified.",
      ].join("\n"),
    );
    expect(issues.filter((i) => i.kind === "INAUTHENTIC_DOCUMENTS")).toHaveLength(1);
  });

  it("says nothing about an empty notice", () => {
    expect(detectIssues("")).toEqual([]);
  });
  /**
   * The suppression rule is narrow on purpose, and both halves of it are load-bearing: a generic
   * restatement must not become a phantom issue, and a genuine second issue must not be lost to
   * the same rule.
   */
  it("does not count a generic policy restatement as a second issue", () => {
    const issues = detectIssues(
      "Your detail page policy violation for ASIN B0EXAMPLE1 remains unresolved.",
    );
    expect(issues.map((i) => i.kind)).toEqual(["LISTING"]);
  });

  it("still counts a policy issue raised in its own sentence", () => {
    const issues = detectIssues(
      [
        "We could not verify the authenticity of the invoices you supplied.",
        "Your account also has repeated policy violations that remain unresolved.",
      ].join("\n"),
    );
    expect(issues.map((i) => i.kind)).toEqual(["INAUTHENTIC_DOCUMENTS", "POLICY"]);
  });

  it("keeps two different issues named in one sentence", () => {
    const issues = detectIssues(
      "",
      "Confirm your identity verification and upload the requested restricted product approval.",
    );
    expect(issues.map((i) => i.kind).sort()).toEqual(["RESTRICTED_PRODUCT", "VERIFICATION"]);
  });
});

describe("a case built from a notice raising two issues", () => {
  function twoIssueWorkspace(): Workspace {
    const base: Workspace = {
      ...newWorkspace(),
      notice: TWO_ISSUE_NOTICE,
      formInstructions: "Upload documents",
      protocol: "documents",
      confirmed: true,
      requirementsConfirmed: true,
    };
    return { ...base, issues: proposedIssues(base) };
  }

  it("will not report itself ready while an issue is unanswered", () => {
    const w = twoIssueWorkspace();
    expect(w.issues).toHaveLength(2);
    expect(workspaceGaps(w).some((g) => /raises 2 separate issues/i.test(g))).toBe(true);
  });

  it("clears once the seller confirms the response covers both", () => {
    const w = { ...twoIssueWorkspace(), issuesConfirmed: true };
    expect(workspaceGaps(w).some((g) => /separate issues/i.test(g))).toBe(false);
  });

  it("asks nothing extra of a single-issue case", () => {
    const base: Workspace = {
      ...newWorkspace(),
      notice: "Please provide the supplier invoice for the affected product.",
      formInstructions: "Upload documents",
      protocol: "documents",
      confirmed: true,
      requirementsConfirmed: true,
    };
    const w = { ...base, issues: proposedIssues(base) };
    expect(workspaceGaps(w).some((g) => /separate issues/i.test(g))).toBe(false);
  });
});
