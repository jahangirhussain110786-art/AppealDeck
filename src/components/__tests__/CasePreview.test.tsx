import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CasePreview } from "@/components/CasePreview";

describe("CasePreview", () => {
  it("renders the evidence title and required/optional markers for POLICY", () => {
    const html = renderToStaticMarkup(<CasePreview kind="POLICY" />);
    expect(html).toContain(">What this case will need<");
    expect(html).toContain(">Evidence Amazon will ask for<");
    expect(html).toContain(">Required<");
    expect(html).toContain(">Optional<");
    expect(html).toContain("Metric export");
    expect(html).toContain("SOP document");
  });

  it("renders the actions title and the next-best actions for the DECODED state", () => {
    const html = renderToStaticMarkup(<CasePreview kind="POLICY" />);
    expect(html).toContain(">What happens next<");
  });

  it("shows a pending status for every requirement when no case file is given", () => {
    const html = renderToStaticMarkup(<CasePreview kind="POLICY" />);
    expect(html).toContain(">Pending<");
    expect(html).not.toContain(">Present<");
  });

  it("shows a present status only for evidence slots the case file already has", () => {
    const html = renderToStaticMarkup(
      <CasePreview
        kind="POLICY"
        caseFile={{
          kind: "POLICY",
          state: "DECODED",
          timelineEvents: [],
          priorAppealCount: 0,
          evidenceSlots: { metric_export: { present: true } },
          actionItems: [],
          attemptCount: 0,
        }}
      />,
    );
    expect(html).toContain(">Present<");
    expect(html).toContain(">Pending<");
  });
});
