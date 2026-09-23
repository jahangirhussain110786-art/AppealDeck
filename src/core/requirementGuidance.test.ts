import { describe, expect, it } from "vitest";
import { requirementGuidance, alternativesFor } from "./requirementGuidance";
import { REQUIREMENT_CANDIDATES, evidenceKindForRequirement } from "./workspace";
import { requirementsFor } from "./evidenceModel";

/**
 * A-05, A-06 and A-02 were each built, tested, ticked off as delivered, and reachable by no seller
 * — the first two rendered only in the dev-only gallery, the third called only by the retired
 * interview's step engine. These tests pin the bridge that makes them reachable, and in particular
 * pin the honesty constraints, because guidance a seller reads in a crisis is the last place an
 * unearned claim should be able to appear.
 */
describe("requirement guidance", () => {
  it("maps every label this parser can produce to a real evidence kind", () => {
    // The pairing lives beside the label producer so it cannot drift. If a candidate is ever added
    // without a kind, or with a kind the matrix does not know, this fails rather than silently
    // showing a seller nothing.
    for (const candidate of REQUIREMENT_CANDIDATES) {
      expect(evidenceKindForRequirement(candidate.label)).toBe(candidate.evidenceKind);
    }
  });

  it("returns nothing for a requirement the seller added by hand", () => {
    // Undefined is a normal answer. Inventing guidance for an unknown record is the failure mode.
    expect(requirementGuidance("A record I typed myself", "INAUTHENTIC_DOCUMENTS")).toBeUndefined();
  });

  it("gives the supplier invoice its matrix sentence, its disqualifiers and its letter", () => {
    const g = requirementGuidance("Supplier invoice", "INAUTHENTIC_DOCUMENTS")!;
    expect(g.evidenceKind).toBe("supplier_invoice");
    expect(g.whyAmazonWantsIt).toBe(
      requirementsFor("INAUTHENTIC_DOCUMENTS").find((r) => r.kind === "supplier_invoice")
        ?.whyAmazonWantsIt,
    );
    // The half sellers most often get wrong, and which nothing in the product used to say.
    expect(g.disqualifiers.join(" ")).toMatch(/pro-forma/i);
    expect(g.letters.map((l) => l.id)).toContain("supplier_invoice_request");
  });

  it("still describes the record on an unclassified case", () => {
    // EVIDENCE_MATRIX.UNKNOWN is empty, and a case started by typing a notice straight into /case
    // is UNKNOWN. Without the fallback the entire matrix is invisible on the most ordinary path
    // into the product — the "built and unreachable" failure this whole pass exists to end.
    expect(requirementsFor("UNKNOWN")).toHaveLength(0);
    const g = requirementGuidance("Supplier invoice", "UNKNOWN")!;
    expect(g.whyAmazonWantsIt).toBeTruthy();
    expect(g.disqualifiers.join(" ")).toMatch(/pro-forma/i);
  });

  it("stays silent when a classified case's matrix does not name the record", () => {
    // Borrowing another violation's sentence here would put a wrong reason on screen: the
    // identity-document sentence talks about funds release, which reads as nonsense elsewhere.
    const kind = "PERFORMANCE_METRIC" as const;
    expect(requirementsFor(kind).some((r) => r.kind === "supplier_invoice")).toBe(false);
    expect(requirementGuidance("Supplier invoice", kind)!.whyAmazonWantsIt).toBeUndefined();
  });

  it("always offers a way forward, and states what each path costs", () => {
    for (const candidate of REQUIREMENT_CANDIDATES) {
      const alts = alternativesFor(candidate.evidenceKind);
      // The dead end this feature exists to remove: every record has at least one honest path.
      expect(alts.length).toBeGreaterThan(0);
      for (const a of alts) {
        expect(a.consequence.trim().length).toBeGreaterThan(0);
        expect(a.honestyNote.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("never states a chance, a likelihood or what Amazon will decide", () => {
    // D6. The consequence has to be real and unsoftened, which is exactly why it must not drift
    // into a prediction — "this usually works" is the claim this product does not make.
    const all = REQUIREMENT_CANDIDATES.flatMap((c) => alternativesFor(c.evidenceKind));
    for (const a of all) {
      const text = `${a.label} ${a.honestyNote} ${a.consequence}`;
      expect(text).not.toMatch(/\b(guarantee|likely|chance|odds|probably|success rate|%)\b/i);
      expect(text).not.toMatch(/\bwill be (approved|reinstated|accepted)\b/i);
    }
  });

  it("offers the sourcing-change path only where it applies", () => {
    expect(alternativesFor("supplier_invoice").map((a) => a.id)).toContain("sourcing_change");
    expect(alternativesFor("metric_export").map((a) => a.id)).not.toContain("sourcing_change");
    // Continuing without the record is always available, because refusing to let a seller move on
    // is the behaviour this replaces.
    expect(alternativesFor("metric_export").map((a) => a.id)).toContain("decline_proceed");
  });
});
