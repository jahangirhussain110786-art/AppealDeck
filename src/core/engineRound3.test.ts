/**
 * 7 Oct 2026 hand review of the notice engine: ordinary Amazon wording that was misread.
 */
import { describe, it, expect } from "vitest";
import { determineResponseType } from "./responseType";
import { parseNotice } from "./noticeParser";
import { statedDeadlineOf } from "./noticeDate";
import { proposedRequirements } from "./workspace";

describe("response type for a request written as a list", () => {
  it("reads a list under a request lead-in as documents", () => {
    const r = determineResponseType(
      "To reactivate your selling account, please send us:\n-- Copies of invoices from your supplier\n-- A letter of authorization from the brand",
    );
    expect(r.type).toBe("SUPPORTING_DOCUMENTS");
    const n = determineResponseType(
      "To reactivate, please provide:\n1. Invoices for the ASINs\n2. Letter of authorization",
    );
    expect(n.type).toBe("SUPPORTING_DOCUMENTS");
  });

  it("does not read a list under a colon with no request as a request", () => {
    expect(determineResponseType("Your account health:\n- Invoices\n- Orders").type).toBe(
      "UNDETERMINED",
    );
  });
});

describe("windows that are Amazon's own review time", () => {
  it("does not count Amazon's reply time after a seller step", () => {
    for (const text of [
      "Once you submit your appeal, we will review it within 5 days.",
      "When you send the documents, Amazon will reply within 7 days.",
      "If you reply to this message, we respond within 3 days.",
    ]) {
      const p = parseNotice(text);
      expect(p.statedWindowDays, text).toBeNull();
    }
    expect(
      parseNotice("If you submit a Plan of Action, we will respond within 2 business days.")
        .statedBusinessDays,
    ).toBeNull();
  });

  it("still counts the seller's own window", () => {
    expect(parseNotice("You must respond within 5 days.").statedWindowDays).toBe(5);
  });
});

describe("a stated deadline worded with 'is' or a time of day", () => {
  it("reads them", () => {
    expect(statedDeadlineOf("The deadline to appeal is 30 September 2026.", null)?.day).toBe(
      "2026-09-30",
    );
    expect(
      statedDeadlineOf("Please respond no later than 5pm on 10 October 2026.", null)?.day,
    ).toBe("2026-10-10");
  });
});

describe("a deadline written as a condition on Amazon's action", () => {
  it("reads the date of 'if no appeal is received by'", () => {
    expect(
      statedDeadlineOf(
        "Amazon will close your account if no appeal is received by 10 October 2026.",
        null,
      )?.day,
    ).toBe("2026-10-10");
  });

  it("still ignores Amazon's own timetable", () => {
    expect(statedDeadlineOf("We will review your appeal by 10 October 2026.", null)).toBeNull();
  });
});

describe("authenticity wording", () => {
  it("classifies 'do not appear to be authentic'", () => {
    expect(
      parseNotice("The invoices you sent us do not appear to be authentic.").kindHints,
    ).toContain("INAUTHENTIC");
  });
});

describe("requests worded with attach or supply", () => {
  it("raises the record", () => {
    expect(
      proposedRequirements(
        {
          notice: "Please attach copies of your supplier invoices.",
          formInstructions: "",
          revision: 1,
        },
        "UNKNOWN",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      proposedRequirements(
        { notice: "You must supply invoices for these ASINs.", formInstructions: "", revision: 1 },
        "UNKNOWN",
      ).length,
    ).toBeGreaterThan(0);
  });
});
