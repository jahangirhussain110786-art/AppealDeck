import { describe, expect, it } from "vitest";
import { FIXTURES } from "./fixtures";
import { runDecode } from "./index";
import { determineResponseType } from "./responseType";
import { isOfferLevelNotice, OFFER_LEVEL_DEADLINE_LABEL, OFFER_LEVEL_REASON } from "./noticeScope";

const OFFER = FIXTURES.find((f) => f.id === "performance-5-fbm-offer-level")!.raw;

describe("a notice about one offer, not the account (8 Oct 2026)", () => {
  it("is recognised from the seller's own text", () => {
    expect(isOfferLevelNotice(OFFER)).toBe(true);
  });

  it("is still a performance case", () => {
    expect(runDecode(OFFER, {}).classification.kind).toBe("PERFORMANCE_METRIC");
  });

  it("does not claim an appeal window it was never given", () => {
    const labels = runDecode(OFFER, {}).deadlines.map((d) => d.label);
    expect(labels).toEqual([OFFER_LEVEL_DEADLINE_LABEL]);
    expect(labels.join(" ")).not.toMatch(/appeal window/i);
  });

  it("sends the seller to Account Health instead of saying it cannot tell", () => {
    const result = determineResponseType(OFFER);
    expect(result.type).toBe("UNDETERMINED");
    expect(result.reason).toBe(OFFER_LEVEL_REASON);
    expect(result.reason).toMatch(/Other Policy Violations/);
  });

  it("never states a figure or a date it was not given", () => {
    const shown = `${OFFER_LEVEL_REASON} ${OFFER_LEVEL_DEADLINE_LABEL}`;
    expect(shown).not.toMatch(/\d/);
    expect(shown).not.toMatch(/guarantee/i);
  });

  it("keeps a stated Plan of Action request: the offer wording does not hide what Amazon asks for", () => {
    const withRequest = `${OFFER}\n\nSubmit a plan of action describing the root cause of the late deliveries.`;
    expect(determineResponseType(withRequest).type).toBe("PLAN_OF_ACTION");
  });

  it("does not narrow a whole-account notice that merely mentions a listing", () => {
    const whole =
      "Your selling account has been deactivated. We removed the listing for ASIN B0C1234567 because of a policy violation. Submit a plan of action.";
    expect(isOfferLevelNotice(whole)).toBe(false);
    const ordinary = FIXTURES.filter((f) => f.id !== "performance-5-fbm-offer-level").filter((f) =>
      isOfferLevelNotice(f.raw),
    );
    expect(ordinary.map((f) => f.id)).toEqual([]);
  });

  it("does not call an unrelated listing deactivation offer-level without the seller-fulfilled wording", () => {
    expect(isOfferLevelNotice("We have deactivated your listing for ASIN B0C1234567.")).toBe(false);
  });
});
