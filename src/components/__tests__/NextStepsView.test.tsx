import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextStepsView } from "@/components/NextStepsView";
import type { CaseFile } from "@/core";
import { ROOT_CAUSE_GAP_MESSAGE, PREVENTIVE_MEASURES_GAP_MESSAGE } from "@/core";

function makeCaseFile(overrides: Partial<CaseFile> = {}): CaseFile {
  return {
    kind: "POLICY",
    state: "REMEDIATION",
    timelineEvents: [],
    priorAppealCount: 0,
    evidenceSlots: {},
    actionItems: [],
    attemptCount: 0,
    ...overrides,
  };
}

describe("NextStepsView", () => {
  it("always leads with the not-ready framing, never a structured-POA heading", () => {
    const html = renderToStaticMarkup(<NextStepsView caseFile={makeCaseFile()} />);
    expect(html).toContain("Not ready to submit yet");
    expect(html).not.toContain(">Root Cause<");
    expect(html).not.toContain(">Corrective Actions<");
  });

  it("shows the root-cause gap message and a fix-in-interview link when the narrative is thin", () => {
    const html = renderToStaticMarkup(
      <NextStepsView caseFile={makeCaseFile({ rootCause: "idk" })} />,
    );
    // React escapes the apostrophe as an HTML entity in static markup.
    expect(html).toContain(ROOT_CAUSE_GAP_MESSAGE.replace("isn't", "isn&#x27;t"));
    expect(html).toContain("Continue the interview");
    expect(html).toContain('href="/case"');
  });

  it("shows the preventive-measures gap message when that narrative is thin, even with a good root cause", () => {
    const html = renderToStaticMarkup(
      <NextStepsView
        caseFile={makeCaseFile({
          rootCause:
            "Our listing verification process did not check that the supplier invoice matched the ASIN before inventory was sent to Amazon.",
          preventiveMeasures: "n/a",
        })}
      />,
    );
    expect(html).toContain(PREVENTIVE_MEASURES_GAP_MESSAGE);
  });

  it("reports the root-cause and preventive-measures pillars complete once both narratives are sufficient", () => {
    const html = renderToStaticMarkup(
      <NextStepsView
        caseFile={makeCaseFile({
          rootCause:
            "Our listing verification process did not check that the supplier invoice matched the ASIN before inventory was sent to Amazon.",
          preventiveMeasures:
            "We added a two-person invoice check and blocked new inventory until the ASIN and supplier details match.",
        })}
      />,
    );
    expect(html).not.toContain(ROOT_CAUSE_GAP_MESSAGE);
    expect(html).not.toContain(PREVENTIVE_MEASURES_GAP_MESSAGE);
    expect(html).toContain("Your root-cause narrative has enough detail to draft from.");
    expect(html).toContain("Your preventive-measures narrative has enough detail to draft from.");
  });

  it("never renders a Copy or print affordance — there is nothing submittable yet", () => {
    const html = renderToStaticMarkup(<NextStepsView caseFile={makeCaseFile()} />);
    expect(html).not.toContain("Copy full POA");
    expect(html).not.toContain("print-only");
  });
});
