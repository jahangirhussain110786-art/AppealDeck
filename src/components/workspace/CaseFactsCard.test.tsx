import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CaseFactsCard } from "./CaseFactsCard";
import { ChangesSinceLastTry } from "./ChangesSinceLastTry";
import { RootCauseCoach } from "./RootCauseCoach";
import { invoiceCoverage } from "@/core/invoiceCoverage";
import type { ChangeReport } from "@/core/changeReport";
import type { SavedDocumentCheck } from "@/core/documentCheck";

const invoice = (recordId: string, quantity: string): SavedDocumentCheck => ({
  recordId,
  at: "2026-10-10T08:00:00.000Z",
  contextKey: "k",
  outcome: {
    kind: "fields",
    result: {
      evidenceKind: "supplier_invoice",
      findings: [
        {
          field:
            "invoiced quantity consistent with units sold of each cited ASIN in the 365 days before the notice",
          status: "not_assessed",
          observed: quantity,
          note: "",
        },
      ],
      triggeredDisqualifiers: [],
      allRequiredFieldsPresent: true,
    },
  },
});

describe("the business-details card", () => {
  it("shows the units-sold field, and the invoices against it once the seller has stated a figure", () => {
    const coverage = invoiceCoverage([invoice("a", "Qty: 100")], 400);
    const html = renderToStaticMarkup(
      <CaseFactsCard
        facts={{ businessName: "Hawlton Trading", unitsSold: 400 }}
        coverage={coverage}
        busy={false}
        onSave={async () => true}
      />,
    );
    expect(html).toContain(
      "Units you sold of the products in the notice, in the 365 days before it",
    );
    expect(html).toContain('value="400"');
    expect(html).toContain("Your invoices against what you sold");
    expect(html).toContain("show 100 units in total");
    expect(html).toContain("fall short by 300");
  });

  it("shows no result box until a figure is stated", () => {
    const html = renderToStaticMarkup(
      <CaseFactsCard facts={undefined} coverage={null} busy={false} onSave={async () => true} />,
    );
    expect(html).toContain("Units you sold");
    expect(html).not.toContain("Your invoices against what you sold");
  });
});

const report = (over: Partial<ChangeReport> = {}): ChangeReport => ({
  comparedTo: { at: "2026-10-01T09:00:00.000Z", revision: 1, fromBeforeAppealDeck: false },
  text: {
    comparable: true,
    verdict: "revised",
    added: ["On 3 Oct 2026 our supplier sent the report.", "We now take returns more seriously."],
    addedWithNewFacts: ["On 3 Oct 2026 our supplier sent the report."],
    removedCount: 0,
  },
  documents: { comparable: true, added: ["Supplier invoice (invoice-b.pdf)"], removed: [] },
  resolved: ["Add the packing list"],
  stillOpen: ["Answer the question"],
  level: "changed",
  nothingChanged: false,
  ...over,
});

describe("the change report", () => {
  it("lists what is new, putting the sentences with new facts first", () => {
    const html = renderToStaticMarkup(<ChangesSinceLastTry report={report()} />);
    expect(html).toContain("What has changed since your last response");
    expect(html.indexOf("On 3 Oct 2026")).toBeLessThan(html.indexOf("We now take returns"));
    expect(html).toContain("Supplier invoice (invoice-b.pdf)");
    expect(html).toContain("Open then, finished now");
    expect(html).toContain("Add the packing list");
    expect(html).toContain("Still open from last time");
  });

  it("warns plainly when nothing has changed, and when very little has", () => {
    const nothing = renderToStaticMarkup(
      <ChangesSinceLastTry
        report={report({
          level: "nothing",
          nothingChanged: true,
          text: {
            comparable: true,
            verdict: "identical",
            added: [],
            addedWithNewFacts: [],
            removedCount: 0,
          },
          documents: { comparable: true, added: [], removed: [] },
          resolved: [],
        })}
      />,
    );
    expect(nothing).toContain("Nothing has changed since your last response");
    expect(nothing).not.toContain("New in this response");
    const little = renderToStaticMarkup(
      <ChangesSinceLastTry
        report={report({
          level: "little",
          text: {
            comparable: true,
            verdict: "near-identical",
            added: ["We now take returns more seriously."],
            addedWithNewFacts: [],
            removedCount: 0,
          },
          documents: { comparable: true, added: [], removed: [] },
          resolved: [],
        })}
      />,
    );
    expect(little).toContain("Very little has changed since your last response");
    expect(little).toContain("New or reworded");
  });

  it("says it cannot compare with an attempt made before AppealDeck, and does not predict anything", () => {
    const html = renderToStaticMarkup(
      <ChangesSinceLastTry
        report={report({
          comparedTo: { at: "2026-09-01T09:00:00.000Z", revision: 0, fromBeforeAppealDeck: true },
          text: {
            comparable: false,
            verdict: "cannot-compare",
            added: [],
            addedWithNewFacts: [],
            removedCount: 0,
          },
        })}
      />,
    );
    expect(html).toContain("We cannot fully compare with your earlier attempt");
    expect(html).not.toMatch(/\b(?:will be accepted|approved|guarantee|likely to)\b/i);
  });
});

describe("the root-cause coach", () => {
  it("asks five questions with an example each, and is closed until opened", () => {
    const html = renderToStaticMarkup(
      <RootCauseCoach
        kind="PERFORMANCE_METRIC"
        draft={{ "response.coach.failure": "Packing started late" }}
        hasText={false}
        busy={false}
        onAnswer={() => undefined}
        onUse={() => undefined}
      />,
    );
    expect(html).toContain("<details");
    expect(html).not.toContain("<details open");
    expect(html).toContain("Which measure was missed");
    expect(html).toContain("Packing started late");
    expect(html.match(/For example:/g)).toHaveLength(5);
    expect(html).toContain("Put my answers in the box");
  });

  it("offers to add below the seller's own text instead of replacing it", () => {
    const html = renderToStaticMarkup(
      <RootCauseCoach
        kind="POLICY"
        draft={{}}
        hasText
        busy={false}
        onAnswer={() => undefined}
        onUse={() => undefined}
      />,
    );
    expect(html).toContain("Add my answers below what I wrote");
  });
});
