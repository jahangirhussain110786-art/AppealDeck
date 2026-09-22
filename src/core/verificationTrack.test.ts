import { describe, it, expect } from "vitest";
import {
  verificationChecklist,
  verificationFlavour,
  VERIFICATION_FLAVOUR_LABELS,
} from "./verificationTrack";

describe("verificationFlavour", () => {
  it.each([
    ["We could not verify your identity during the video call.", "video_call"],
    ["Please complete your INFORM Consumers Act certification.", "inform"],
    ["You must re-certify your business information annually.", "inform"],
    ["Please provide government-issued identification.", "document"],
    ["Upload your passport to continue.", "document"],
    ["Your account requires verification.", "unspecified"],
  ] as const)("reads %s as %s", (notice, expected) => {
    expect(verificationFlavour(notice)).toBe(expected);
  });

  it("says unspecified rather than guessing when the notice is vague", () => {
    expect(verificationFlavour("Your account is under review.")).toBe("unspecified");
  });
});

describe("verificationChecklist", () => {
  it("always covers the three checks that cause most failures", () => {
    const ids = verificationChecklist("Your account requires verification.").steps.map((s) => s.id);
    expect(ids).toContain("identify_request");
    expect(ids).toContain("match_details");
    expect(ids).toContain("check_validity");
  });

  it("puts finding the request before preparing anything", () => {
    const ids = verificationChecklist("Please provide your passport.").steps.map((s) => s.id);
    expect(ids.indexOf("identify_request")).toBeLessThan(ids.indexOf("capture_quality"));
  });

  it("adds capture and no-edit steps for a document request", () => {
    const { steps, flavour } = verificationChecklist("Please provide your passport.");
    expect(flavour).toBe("document");
    const ids = steps.map((s) => s.id);
    expect(ids).toContain("capture_quality");
    expect(ids).toContain("no_edits");
  });

  it("adds call-specific steps for a video call", () => {
    const ids = verificationChecklist("We could not verify you during the video call.").steps.map(
      (s) => s.id,
    );
    expect(ids).toContain("originals_present");
    expect(ids).not.toContain("capture_quality");
  });

  it("adds the certification window step for INFORM", () => {
    const ids = verificationChecklist(
      "Complete your INFORM Consumers Act certification.",
    ).steps.map((s) => s.id);
    expect(ids).toContain("inform_window");
  });

  it("tells a seller to go and check when the kind is unclear, rather than inventing steps", () => {
    const { steps } = verificationChecklist("Your account requires verification.");
    const confirm = steps.find((s) => s.id === "confirm_kind")!;
    expect(confirm.detail).toMatch(/Check the response page/i);
  });

  it("ends by recording what was sent", () => {
    const steps = verificationChecklist("Please provide your passport.").steps;
    expect(steps.at(-1)!.id).toBe("record_what_sent");
  });

  /** The single most damaging instruction this checklist could give. */
  it("tells the seller never to alter a document, and says why", () => {
    const step = verificationChecklist("Please provide your passport.").steps.find(
      (s) => s.id === "no_edits",
    )!;
    expect(step.detail).toMatch(/treated as a forged one/i);
    expect(step.critical).toBe(true);
  });

  it("never predicts an outcome or a timeline", () => {
    for (const notice of [
      "Please provide your passport.",
      "We could not verify you during the video call.",
      "Complete your INFORM Consumers Act certification.",
      "Your account requires verification.",
    ]) {
      const text = verificationChecklist(notice)
        .steps.map((s) => `${s.title} ${s.detail}`)
        .join(" ");
      for (const banned of [
        /will be (?:approved|reinstated|accepted)/i,
        /within \d+ (?:hours|days)/i,
        /your chances/i,
        /likely to/i,
      ]) {
        expect(text).not.toMatch(banned);
      }
    }
  });

  it("labels every flavour", () => {
    for (const key of Object.keys(VERIFICATION_FLAVOUR_LABELS)) {
      expect(
        VERIFICATION_FLAVOUR_LABELS[key as keyof typeof VERIFICATION_FLAVOUR_LABELS],
      ).toBeTruthy();
    }
  });
});
