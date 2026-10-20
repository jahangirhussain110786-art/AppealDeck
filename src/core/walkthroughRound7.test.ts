import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runDecode } from "./index";
import { STORES } from "../content/stores";
import {
  composePayloadWorkspace,
  newWorkspace,
  proposedRequirements,
  recordPriorAttempt,
  writtenPartGaps,
  type Workspace,
} from "./workspace";

/** The walk-through of 20 Oct 2026: harder sellers, each case checked against the notice's own words. */
const read = (f: string) =>
  readFileSync(join(process.cwd(), "docs/handoffs/2026-10-19-seller-test", f), "utf8");
const labelsFor = (text: string) => {
  const kind = runDecode(text, {}).classification.kind;
  const w: Workspace = { ...newWorkspace(), notice: text };
  return { kind, all: proposedRequirements(w, kind).map((r) => r.label) };
};

describe("S2: a design-patent complaint", () => {
  const { kind, all } = labelsFor(read("notice-2-design-patent.txt"));

  it("is an intellectual property case", () => {
    expect(kind).toBe("INTELLECTUAL_PROPERTY");
  });

  it("raises the three answers the notice lists", () => {
    expect(all).toEqual(
      expect.arrayContaining([
        "Supplier invoice",
        "Patent attorney's analysis",
        "Licence from the rights owner",
      ]),
    );
  });

  it("does not demand a brand's authorization letter, which answers a trademark complaint", () => {
    expect(all).not.toContain("Authorization letter");
  });
});

describe("S4: a UK VAT and business verification", () => {
  const { kind, all } = labelsFor(read("notice-4-uk-vat.txt"));

  it("is a verification, and names the VAT certificate as itself", () => {
    expect(kind).toBe("VERIFICATION");
    expect(all).toContain("VAT registration certificate");
    expect(all).not.toContain("Other requested record");
  });

  it("explains a bank statement by what a verification checks, not by a funds release", async () => {
    const { requirementsFor } = await import("./evidenceModel");
    const bank = requirementsFor("VERIFICATION").find((r) => r.kind === "financial_instrument_doc");
    expect(bank?.whyAmazonWantsIt).toMatch(/registered on the account/);
    expect(bank?.whyAmazonWantsIt).not.toMatch(/funds/i);
  });
});

describe("a trademark complaint still asks for the authorization letter", () => {
  it("raises it when the notice is not about a patent", () => {
    const { all } = labelsFor(read("notice-C-trademark.txt"));
    expect(all).toContain("Authorization letter");
  });
});

describe("S5: a second-round Plan of Action the seller has rewritten", () => {
  const prior =
    "Dear Seller Performance Team, we are sorry for the problems. We take customer satisfaction very seriously and our ODR went up because of some unhappy customers. We have improved our processes and will make sure it never happens again. Please reinstate our account.";
  const rewrite =
    "Of the 31 defect orders in the attached log, 14 were dog harness orders delivered with the wrong size label because our warehouse relabelled the S and M bags in August. Those caused 9 of the 11 A-to-z claims and 8 of the 13 negative feedback.";
  const build = (): Workspace => {
    const base: Workspace = {
      ...newWorkspace(),
      notice: read("reply-5-second-refusal.txt"),
      revision: 2,
      protocol: "operational",
      confirmed: true,
      explanation: rewrite,
      correctiveActions:
        "Finished: on 28 September 2026 we replaced the S and M bag labels and relabelled all 212 units in stock.",
      preventiveMeasures:
        "A second person checks the size label against the product on every new batch before it goes on sale.",
    };
    return recordPriorAttempt(base, { at: "2026-09-24T00:00:00.000Z", text: prior });
  };

  it("clears the 'root cause is missing' line on the tab and on the server's copy of the case", () => {
    const w = build();
    expect(writtenPartGaps(w)).not.toContain(STORES.rootCauseFaulted);
    expect(writtenPartGaps(composePayloadWorkspace(w))).not.toContain(STORES.rootCauseFaulted);
  });

  it("keeps the line when the seller has only resent the same words", () => {
    const w = { ...build(), explanation: prior + " " + prior };
    expect(writtenPartGaps(composePayloadWorkspace(w))).toContain(STORES.rootCauseFaulted);
  });

  it("never sends the wording of what was sent", () => {
    const sent = composePayloadWorkspace(build()).submissions;
    expect(sent.every((s) => s.text === "")).toBe(true);
  });
});

describe("the server reading names the document, and code decides whether to point", () => {
  it("points at a receipt or a quotation and stays quiet for an invoice", async () => {
    const { documentKindPointer } = await import("./localReading");
    expect(documentKindPointer("retail store receipt")?.status).toBe("unclear");
    expect(documentKindPointer("Sales receipt")?.note).toMatch(/store receipt/);
    expect(documentKindPointer("pro forma invoice")?.note).toMatch(/quotation/);
    expect(documentKindPointer("quotation")?.status).toBe("unclear");
    expect(documentKindPointer("invoice")).toBeUndefined();
    expect(documentKindPointer("commercial invoice")).toBeUndefined();
    expect(documentKindPointer("")).toBeUndefined();
    expect(documentKindPointer(undefined)).toBeUndefined();
  });
});

describe("J: a vague deactivation that asks for a cause and prevention in plain words", () => {
  const text = read("notice-J-vague-deactivation.txt");

  it("is a Plan of Action request, so the seller is not left to guess", async () => {
    const { determineResponseType } = await import("./responseType");
    expect(determineResponseType(text).type).toBe("PLAN_OF_ACTION");
  });

  it("does not turn a plain reason into a request", async () => {
    const { determineResponseType } = await import("./responseType");
    const t =
      "Hello, we explain the reason for the delay: the carrier was late. Your order will arrive again soon.";
    expect(determineResponseType(t).type).not.toBe("PLAN_OF_ACTION");
  });
});
