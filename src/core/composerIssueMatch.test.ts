import { describe, expect, it } from "vitest";
import { composePoa, critiquePoa } from "./composer";
import type { CaseFileData } from "./readiness";

/**
 * 8 Oct 2026: a response that answers a different problem from the one the notice raised. The
 * check is a quiet warning: it needs the narrative to use none of its own kind's words and two or
 * more of another kind's.
 */

const LATE_SHIPMENTS =
  "Our late shipment rate rose because the carrier collected parcels later than our handling time promised, so many orders left the warehouse after the expected ship date. We changed the carrier collection time.";

function caseOf(kind: CaseFileData["kind"], rootCause: string): CaseFileData {
  return {
    kind,
    rootCause,
    preventiveMeasures:
      "A named coordinator now checks unshipped orders at noon and at three each working day and records the backlog.",
    evidenceSlots: {},
    actionItems: [],
  };
}

const codes = (data: CaseFileData) =>
  critiquePoa(composePoa(data), data).findings.map((f) => f.code);

describe("a response that answers a different problem", () => {
  it("is warned about: an authenticity notice answered with late shipments", () => {
    const data = caseOf("INAUTHENTIC", LATE_SHIPMENTS);
    const finding = critiquePoa(composePoa(data), data).findings.find(
      (f) => f.code === "OFF_TOPIC_RESPONSE",
    );
    expect(finding?.severity).toBe("warning");
    expect(finding?.message).toMatch(/authenticity/);
    expect(finding?.message).toMatch(/shipping/);
  });

  it("is never an error: it cannot fail the response", () => {
    const data = caseOf("INAUTHENTIC", LATE_SHIPMENTS);
    const only = critiquePoa(composePoa(data), data).findings.filter(
      (f) => f.code === "OFF_TOPIC_RESPONSE",
    );
    expect(only.length).toBe(1);
    expect(only.every((f) => f.severity === "warning")).toBe(true);
  });

  it("stays quiet when the response is about the notice's own problem", () => {
    expect(codes(caseOf("PERFORMANCE_METRIC", LATE_SHIPMENTS))).not.toContain("OFF_TOPIC_RESPONSE");
  });

  it("stays quiet when the topics are mixed: a late shipment caused by a supplier", () => {
    const mixed =
      "Our late shipment rate rose because our supplier delivered stock late and the carrier then missed collection, so orders left the warehouse after the expected ship date. We changed the carrier and the supplier's lead time.";
    expect(codes(caseOf("PERFORMANCE_METRIC", mixed))).not.toContain("OFF_TOPIC_RESPONSE");
    expect(codes(caseOf("INAUTHENTIC", mixed))).not.toContain("OFF_TOPIC_RESPONSE");
  });

  it("stays quiet for a kind with no word list, and for a short response", () => {
    expect(codes(caseOf("POLICY", LATE_SHIPMENTS))).not.toContain("OFF_TOPIC_RESPONSE");
    expect(codes(caseOf("INAUTHENTIC", "Late shipments."))).not.toContain("OFF_TOPIC_RESPONSE");
  });
});
