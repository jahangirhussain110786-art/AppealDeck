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

describe("questionnaire nudges under a thin answer (19 Oct 2026)", () => {
  const topics = WORKSPACE.responseFields.questionTopics;
  const owner = topics.find((t) =>
    t.pattern.test("Who is the beneficial owner of your business?"),
  )!;

  it("asks for names and shares when the answer is only 'the founder'", () => {
    expect(owner.needs.test("The owner is the founder, Redfern.")).toBe(false);
  });
  it("is satisfied by shares, or by a sole owner", () => {
    expect(owner.needs.test("Dana Redfern, 70 percent, and Marcus Ibarra, 30 percent.")).toBe(true);
    expect(owner.needs.test("Jane Smith is the sole owner.")).toBe(true);
  });
  it("asks the other-accounts question to be answered yes or no", () => {
    const t = topics.find((x) => x.pattern.test("Do you operate other Amazon seller accounts?"))!;
    expect(t.needs.test("This business has grown a lot since 2021.")).toBe(false);
    expect(t.needs.test("No. This is the only account.")).toBe(true);
  });
  it("every nudge is one plain sentence", () => {
    for (const t of topics) expect(t.nudge.endsWith(".")).toBe(true);
  });
});
