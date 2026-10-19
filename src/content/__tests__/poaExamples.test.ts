import { describe, expect, it } from "vitest";
import { WORKSPACE } from "../workspace";
import { VIOLATION_KINDS } from "@/core/violationKinds";

describe("per-kind Plan of Action examples (19 Oct 2026)", () => {
  const entries = Object.entries(WORKSPACE.responseFields.poaByKind);

  it("only names real case kinds", () => {
    for (const [kind] of entries) expect(VIOLATION_KINDS).toContain(kind);
  });

  it("gives every box an example in the shape of an answer, not a claim about the case", () => {
    for (const [, ex] of entries)
      for (const text of Object.values(ex)) expect(text.startsWith("For example: ")).toBe(true);
  });

  it("does not show the returns example to an authenticity or performance appeal", () => {
    for (const kind of ["INAUTHENTIC", "PERFORMANCE_METRIC"]) {
      const ex = WORKSPACE.responseFields.poaByKind[kind]!;
      expect(Object.values(ex).join(" ")).not.toMatch(/returned items|returns/i);
    }
  });
});

describe("questionnaire hints by topic (19 Oct 2026)", () => {
  const topics = WORKSPACE.responseFields.questionTopics;
  const find = (q: string) => topics.find((t) => t.pattern.test(q));

  it("gives each common questionnaire question a hint that fits it", () => {
    expect(find("Who is the beneficial owner of your business?")?.hint).toMatch(/legal name/);
    expect(find("Do you operate other Amazon seller accounts?")?.hint).toMatch(/yes or no/i);
    expect(find("What is the source of the inventory for ASIN B0CR8T4NV2?")?.hint).toMatch(
      /supplier/,
    );
    expect(
      find("Describe your business model and how you source the products you sell."),
    ).toBeTruthy();
  });

  it("does not show an unrelated example under a question it does not know", () => {
    expect(find("Why did you change your return address in March?")).toBeUndefined();
  });

  it("every example is shape only and starts 'For example:'", () => {
    for (const t of topics) expect(t.example.startsWith("For example: ")).toBe(true);
  });
});
