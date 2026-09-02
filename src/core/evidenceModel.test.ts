import { describe, it, expect } from "vitest";
import {
  EVIDENCE_MATRIX,
  requirementsFor,
  requiredKinds,
  allKinds,
  type EvidenceRequirement,
} from "./evidenceModel";
import type { ViolationKind } from "./index";

describe("evidenceModel", () => {
  it("defines requirements for every violation kind", () => {
    const kinds: ViolationKind[] = [
      "INAUTHENTIC_DOCUMENTS",
      "INTELLECTUAL_PROPERTY",
      "RELATED_ACCOUNT",
      "LISTING",
      "FUNDS",
      "POLICY",
      "UNKNOWN",
    ];
    for (const k of kinds) {
      expect(EVIDENCE_MATRIX[k]).toBeDefined();
      expect(Array.isArray(EVIDENCE_MATRIX[k])).toBe(true);
    }
  });

  it("requires a supplier invoice for inauthentic documents", () => {
    const kinds = requiredKinds("INAUTHENTIC_DOCUMENTS");
    expect(kinds).toContain("supplier_invoice");
  });

  it("marks brand_authorization as strengthening (not required) for inauthentic", () => {
    const reqs = requirementsFor("INAUTHENTIC_DOCUMENTS");
    const brand = reqs.find((r) => r.kind === "brand_authorization");
    expect(brand).toBeDefined();
    expect(brand!.required).toBe(false);
  });

  it("requires identity + financial-instrument docs for funds", () => {
    const kinds = requiredKinds("FUNDS");
    expect(kinds).toContain("identity_doc");
    expect(kinds).toContain("financial_instrument_doc");
  });

  it("requires listing-fix proof for listing violations", () => {
    expect(requiredKinds("LISTING")).toContain("listing_fix_proof");
  });

  it("requires metric export for policy violations", () => {
    expect(requiredKinds("POLICY")).toContain("metric_export");
  });

  it("returns empty requirements for UNKNOWN", () => {
    expect(allKinds("UNKNOWN")).toEqual([]);
  });

  it("every requirement has a whyAmazonWantsIt sentence", () => {
    for (const kind of Object.keys(EVIDENCE_MATRIX) as ViolationKind[]) {
      for (const req of requirementsFor(kind)) {
        expect(req.whyAmazonWantsIt.length).toBeGreaterThan(0);
      }
    }
  });

  it("every required invoice requirement carries a freshness window", () => {
    for (const kind of Object.keys(EVIDENCE_MATRIX) as ViolationKind[]) {
      for (const req of requirementsFor(kind)) {
        if (req.required && req.kind === "supplier_invoice") {
          expect(req.freshnessDays).toBe(365);
        }
      }
    }
  });

  it("every requirement has at least one disqualifier", () => {
    for (const kind of Object.keys(EVIDENCE_MATRIX) as ViolationKind[]) {
      for (const req of requirementsFor(kind)) {
        expect(req.disqualifiers.length).toBeGreaterThan(0);
      }
    }
  });

  it("supplier invoice fields include the verified 2 Sep 2026 requirements", () => {
    const invoiceReq = requirementsFor("INAUTHENTIC_DOCUMENTS").find(
      (r) => r.kind === "supplier_invoice",
    ) as EvidenceRequirement;
    const fields = invoiceReq.fields.join(" ");
    expect(fields).toContain("physical address");
    expect(fields).toContain("phone/contact");
    expect(fields).toContain("365");
    expect(invoiceReq.disqualifiers).toContain("pro-forma invoices and quotes");
    expect(invoiceReq.disqualifiers).toContain("order-confirmation screenshots");
  });
});
