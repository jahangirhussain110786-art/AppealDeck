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

describe("BeforeYouSubmitChecklist, records that could not be obtained (19 Oct 2026)", () => {
  it("does not say '2 of 2 attached' when one record was declared missing", () => {
    const html = renderToStaticMarkup(
      <BeforeYouSubmitChecklist
        caseFile={createCaseFile("INAUTHENTIC")}
        attemptCount={0}
        draftText="Root cause: a missing letter."
        allChecked={false}
        requirements={[
          { label: "Supplier invoice", status: "reviewed" },
          { label: "Authorization letter", status: "cannot_obtain" },
        ]}
      />,
    );
    expect(html).not.toContain("2 of 2 attached");
    expect(html).toContain("1 of 2 attached");
    expect(html).toContain("Authorization letter");
  });
});

describe("BeforeYouSubmitChecklist, a response that adds facts (19 Oct 2026)", () => {
  const sent =
    "WHO IS THE BENEFICIAL OWNER?\nThe owner is the founder.\nDESCRIBE YOUR BUSINESS MODEL.\nWe sell kitchen tools and buy from two US distributors and keep every invoice we are sent.\nOTHER ACCOUNTS?\nNo.";
  const props = {
    caseFile: createCaseFile("POLICY"),
    attemptCount: 1,
    allChecked: false,
    requirements: [],
    priorSubmissions: [{ at: "2026-10-19T08:00:00.000Z", revision: 1, text: sent }],
  };

  it("still warns on the same text", () => {
    const html = renderToStaticMarkup(<BeforeYouSubmitChecklist {...props} draftText={sent} />);
    expect(html).toMatch(/Not yet|word for word|same text/i);
  });

  it("does not call a response 'almost word for word' when it adds a name and a share", () => {
    const html = renderToStaticMarkup(
      <BeforeYouSubmitChecklist
        {...props}
        draftText={sent.replace(
          "The owner is the founder.",
          "Dana Redfern owns 70 percent and Marcus Ibarra owns 30 percent, registered on 3 March 2021.",
        )}
      />,
    );
    expect(html).toContain("adds facts");
    expect(html).not.toContain("almost word for word");
  });
});
