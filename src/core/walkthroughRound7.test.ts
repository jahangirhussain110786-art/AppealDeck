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

describe("a copyright complaint from a small seller", () => {
  const text = `Subject: Notice of intellectual property rights complaint (ASIN B0DN2K7WQ4)
Date: Oct 18, 2026

We received a report from a rights owner alleging that the images and designs on your listing infringe their copyright. We have removed the listing. You may also submit an appeal with documents that show you created the design or hold a licence to use it.`;
  const { kind, all } = labelsFor(text);

  it("asks for what the notice names, in its own words", () => {
    expect(kind).toBe("INTELLECTUAL_PROPERTY");
    expect(all).toEqual(
      expect.arrayContaining(["Proof you created the design", "Licence to use the design"]),
    );
  });

  it("does not ask for a brand's authorization letter", () => {
    expect(all).not.toContain("Authorization letter");
  });
});

describe("a licence that allows personal use only", () => {
  it("is pointed out on the device reading, quoted and not judged", async () => {
    const { readFieldsFromText } = await import("./localReading");
    const { requirementForCheck } = await import("./documentCheck");
    const fields = requirementForCheck("INTELLECTUAL_PROPERTY", "brand_authorization")!.fields;
    const found = readFieldsFromText(
      "Order receipt\nFloral Paw Clipart Bundle\nLicence terms\nPersonal use only. You may print this artwork for yourself.\nCommercial use requires a commercial licence, sold separately.",
      fields,
      {},
      "pdf_text",
    ).find((f) => f.field === "what use the licence allows");
    expect(found?.status).toBe("unclear");
    expect(found?.observed).toMatch(/Personal use only/);
    expect(found?.note).not.toMatch(/\b(?:invalid|fake|worthless|will be refused)\b/i);
  });

  it("is quiet for a licence that grants commercial use", async () => {
    const { licenceScopePointer } = await import("./localReading");
    expect(
      licenceScopePointer(
        "You may use the artwork on products you sell, including commercial use.",
      ),
    ).toBeUndefined();
    expect(licenceScopePointer("Personal use only.")?.status).toBe("unclear");
    expect(licenceScopePointer(undefined)).toBeUndefined();
  });
});

describe("the response box hint follows the kind of intellectual property complaint", () => {
  it("separates copyright and patent from a brand complaint", async () => {
    const { responseHintKey } = await import("./workspace");
    expect(
      responseHintKey(
        "INTELLECTUAL_PROPERTY",
        "a rights owner alleges your images infringe their copyright",
      ),
    ).toBe("INTELLECTUAL_PROPERTY:copyright");
    expect(
      responseHintKey(
        "INTELLECTUAL_PROPERTY",
        "Type of complaint: Patent (design patent D912,483)",
      ),
    ).toBe("INTELLECTUAL_PROPERTY:patent");
    expect(responseHintKey("INTELLECTUAL_PROPERTY", "a trademark complaint")).toBe(
      "INTELLECTUAL_PROPERTY",
    );
    expect(responseHintKey("FUNDS", "copyright")).toBe("FUNDS");
  });
});

describe("the tone of a written answer", () => {
  it("names a threat, venting and a demand in a furious paragraph, quoting the words", async () => {
    const { assessAnswerTone } = await import("./answerNudges");
    const out = assessAnswerTone(
      "This is so unfair!! Pawsome Prints is bullying small sellers. Put my listing back right now, i will sue if i have to",
    );
    expect(out.map((n) => n.id).sort()).toEqual(["demand", "threat", "venting"]);
    expect(out.find((n) => n.id === "threat")?.found).toContain("sue");
    expect(out.find((n) => n.id === "venting")?.found).toContain("unfair");
  });

  it("says nothing about a calm, specific answer", async () => {
    const { assessAnswerTone } = await import("./answerNudges");
    expect(
      assessAnswerTone(
        "I drew the paw design myself in March 2026. The attached notebook page shows my first sketch, dated 4 March. Please review the listing.",
      ),
    ).toEqual([]);
    expect(
      assessAnswerTone(
        "The patent attorney's analysis is attached and shows the stand does not copy design D912,483.",
      ),
    ).toEqual([]);
  });
});

describe("a prepared response that still carries a threat is not shown as ready", () => {
  it("raises a warning for the furious paragraph and none for a calm one", async () => {
    const { composePoa, critiquePoa } = await import("./composer");
    const { createCaseFile } = await import("./caseFile");
    const run = (text: string) => {
      const workspace: Workspace = {
        ...newWorkspace(),
        notice: "A rights owner alleges your images infringe their copyright.",
        protocol: "documents",
        confirmed: true,
        explanation: text,
      };
      const file = { ...createCaseFile("INTELLECTUAL_PROPERTY"), workspace };
      return critiquePoa(composePoa(file), file).findings.filter((f) => f.code === "ANSWER_TONE");
    };
    expect(
      run(
        "This is so unfair!! Pawsome Prints is bullying small sellers. Put my listing back right now, i will sue if i have to",
      ).length,
    ).toBe(3);
    expect(
      run("I drew the paw design myself in March 2026. The attached sketch page is dated 4 March."),
    ).toEqual([]);
  });
});

describe("a saved reading that found a personal-use licence is raised before sending", () => {
  it("adds a line under Before you send, and not for a reading without the finding", async () => {
    const { workspaceGaps } = await import("./workspace");
    const base: Workspace = {
      ...newWorkspace(),
      notice: "Appeal with documents that show you created the design or hold a licence to use it.",
      protocol: "documents",
      confirmed: true,
      explanation: "I bought the artwork and I am attaching the receipt for the licence I bought.",
      completenessConfirmed: true,
      requirements: [
        {
          id: "r1",
          label: "Licence to use the design",
          sourceQuote: "hold a licence to use it",
          status: "reviewed",
          note: "receipt for the paw art licence",
          recordId: "rec1",
          filename: "licence.pdf",
          contentHash: "h1",
          page: 1,
          evidenceKind: "brand_authorization",
        },
      ],
    } as Workspace;
    const check = (status: "unclear" | "present") =>
      ({
        recordId: "rec1",
        contentHash: "h1",
        at: new Date().toISOString(),
        contextKey: "k",
        outcome: {
          kind: "fields",
          result: {
            findings: [
              {
                field: "what use the licence allows",
                status,
                observed: "Personal use only.",
                note: "n",
              },
            ],
          },
        },
      }) as never;
    expect(workspaceGaps({ ...base, documentChecks: [check("unclear")] }).join("\n")).toMatch(
      /Read the licence terms in Licence to use the design/,
    );
    expect(workspaceGaps({ ...base, documentChecks: [check("present")] }).join("\n")).not.toMatch(
      /Read the licence terms/,
    );
  });
});

describe("M2: a letter from a named brand", () => {
  it("raises the authorization letter when the notice says 'a letter from Forgepoint confirming they are authorized'", () => {
    const { kind, all } = labelsFor(read("notice-M2-authenticity-tools.txt"));
    expect(kind).toBe("INAUTHENTIC");
    expect(all).toEqual(expect.arrayContaining(["Supplier invoice", "Authorization letter"]));
  });
});

describe("the wrong kind of document on the invoice card", () => {
  const read2 = async (text: string) => {
    const { readFieldsFromText } = await import("./localReading");
    const { requirementForCheck } = await import("./documentCheck");
    const fields = requirementForCheck("INAUTHENTIC", "supplier_invoice")!.fields;
    return readFieldsFromText(text, fields, {}, "pdf_text").find(
      (f) => f.field === "what kind of document this is",
    );
  };

  it("points at a bank statement", async () => {
    const f = await read2(
      "Severnside Business Bank Statement date: 30 September 2026\nAccount holder\nCotswold Tea Merchants Ltd\nSort code 40-17-22 Account ending 6615\nOpening balance 6,402.18\nClosing balance 7,118.91",
    );
    expect(f?.status).toBe("unclear");
    expect(f?.note).toMatch(/bank statement/);
  });

  it("does not take a supplier invoice with bank details for a statement", async () => {
    const f = await read2(
      "INVOICE\nFROM\nCrestline Trade Supply Co.\n1450 Industrial Parkway, Columbus, OH 43219\nInvoice date: 3 June 2026\nPay to: account holder Crestline Trade Supply Co., sort code 40-17-22, account number 12345678",
    );
    expect(f).toBeUndefined();
  });
});
