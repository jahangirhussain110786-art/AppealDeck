/**
 * 7 Oct 2026 hand review of the D6 gate, in both directions (the earlier narrowing was caught being
 * too loose, so every change here is pinned from both sides).
 */
import { describe, it, expect } from "vitest";
import { findD6Allegation } from "./violationKinds";

describe("D6 gate, round 3", () => {
  it("gates plain forged-document wording that was slipping through", () => {
    for (const text of [
      "The invoices you submitted were photoshopped.",
      "Your supplier invoices appear to have been modified.",
      "The invoice you provided was not issued by the supplier named on it.",
      "The documents you submitted contain false information.",
      "The documents you submitted contain misleading information.",
    ]) {
      expect(findD6Allegation(text), text).not.toBeNull();
    }
  });

  it("does not gate rules and warnings about edited documents", () => {
    for (const text of [
      "Documents that have been edited or altered will not be accepted.",
      "Invoices must not have been altered or edited.",
      "Please do not submit documents that have been edited.",
      "Your documents have not been altered.",
      "We cannot accept documents that are forged, altered or fabricated.",
      "Submit documents. Falsified documents will result in permanent deactivation.",
      "This listing was edited and the records were updated.",
    ]) {
      expect(findD6Allegation(text), text).toBeNull();
    }
  });

  it("still gates the accusations that sit next to those rules", () => {
    for (const text of [
      "Your invoices were altered.",
      "The invoices you submitted have been edited.",
      "We found that you submitted falsified documents.",
      "Please do not submit documents. The invoice you sent was forged.",
      "You edited the invoices before sending them.",
    ]) {
      expect(findD6Allegation(text), text).not.toBeNull();
    }
  });
});
