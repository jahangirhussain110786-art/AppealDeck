import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BeforeYouSubmitChecklist } from "@/components/BeforeYouSubmitChecklist";
import { createCaseFile } from "@/core/caseFile";

/**
 * 25 Sep 2026: on a workspace case the evidence row counted the retired case model, and read
 * "Missing: Metric export" beside a page listing "Supplier invoice" and "Sales or performance
 * record". Given the workspace's records, it must report exactly those.
 */
describe("BeforeYouSubmitChecklist", () => {
  it("reports the workspace's own records by the names the page uses", () => {
    const html = renderToStaticMarkup(
      <BeforeYouSubmitChecklist
        caseFile={createCaseFile("POLICY")}
        attemptCount={0}
        draftText="Root cause: a listing template."
        allChecked={false}
        requirements={[
          { label: "Supplier invoice", status: "reviewed" },
          { label: "Sales or performance record", status: "needed" },
          { label: "Written procedure", status: "cannot_obtain" },
        ]}
      />,
    );
    expect(html).toContain("Missing: Sales or performance record");
    expect(html).not.toContain("Supplier invoice,");
    expect(html).not.toContain("Written procedure");
    expect(html).not.toContain("Metric export");
  });
});
