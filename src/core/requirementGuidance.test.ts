import { describe, expect, it } from "vitest";
import { requirementGuidance, alternativesFor } from "./requirementGuidance";
import {
  REQUIREMENT_CANDIDATES,
  evidenceKindForRequirement,
  EVIDENCE_KIND_LABELS,
} from "./workspace";
import { requirementsFor, EVIDENCE_MATRIX } from "./evidenceModel";

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
    expect(
      requirementGuidance({ label: "A record I typed myself" }, "INAUTHENTIC_DOCUMENTS"),
    ).toBeUndefined();
  });

  /**
   * J, 23 Sep 2026. Guidance used to be found by matching the label against the five patterns the
   * parser can spot in notice prose, so six of the model's eleven kinds reached nothing at all —
   * a seller on a funds case asking "what does a compliant bank record have to show" got silence,
   * and the silence was indistinguishable from "we have nothing to say".
   */
  it("reaches every evidence kind, not only the five the parser can detect in prose", () => {
    for (const [kind, label] of Object.entries(EVIDENCE_KIND_LABELS)) {
      expect(requirementGuidance({ label }, "UNKNOWN")?.evidenceKind, label).toBe(kind);
    }
  });

  it("prefers the stored kind, so renaming a record does not sever its guidance", () => {
    const renamed = { label: "Acme invoice (scan 3)", evidenceKind: "supplier_invoice" as const };
    expect(requirementGuidance(renamed, "INAUTHENTIC_DOCUMENTS")?.evidenceKind).toBe(
      "supplier_invoice",
    );
    // Without the stored kind the same label reaches nothing, which is what used to happen.
    expect(requirementGuidance({ label: renamed.label }, "INAUTHENTIC_DOCUMENTS")).toBeUndefined();
  });

  it("gives the supplier invoice its matrix sentence, its disqualifiers and its letter", () => {
    const g = requirementGuidance({ label: "Supplier invoice" }, "INAUTHENTIC_DOCUMENTS")!;
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
    const g = requirementGuidance({ label: "Supplier invoice" }, "UNKNOWN")!;
    expect(g.fields.length).toBeGreaterThan(0);
    expect(g.disqualifiers.join(" ")).toMatch(/pro-forma/i);
  });

  /**
   * Corrected 23 Sep 2026 after watching this render. The fallback used to supply
   * `whyAmazonWantsIt` too, and on an unclassified case an *identity* record displayed "Amazon
   * needs to understand how the accounts are connected and whether the same operator is behind
   * both" — because the first matrix entry naming `identity_doc` belongs to the related-account
   * family. The previous version of this test asserted only that the sentence was truthy, so it
   * passed while showing a seller a reason that had nothing to do with their case.
   *
   * What a record must contain is a property of the record. Why Amazon wants it is a property of
   * the violation, and on an unclassified case we do not know the violation.
   */
  it("does not borrow another violation's reason on an unclassified case", () => {
    const identity = requirementGuidance({ evidenceKind: "identity_doc", label: "x" }, "UNKNOWN")!;
    expect(identity.whyAmazonWantsIt).toBeUndefined();
    // The record is still described — silence about the reason is not silence about the record.
    expect(identity.fields.length).toBeGreaterThan(0);

    // And a classified case still gets its own violation's reason, unchanged.
    const classified = requirementGuidance({ label: "Supplier invoice" }, "INAUTHENTIC_DOCUMENTS")!;
    expect(classified.whyAmazonWantsIt).toBeTruthy();
  });

  it("stays silent when a classified case's matrix does not name the record", () => {
    // Borrowing another violation's sentence here would put a wrong reason on screen: the
    // identity-document sentence talks about funds release, which reads as nonsense elsewhere.
    const kind = "PERFORMANCE_METRIC" as const;
    expect(requirementsFor(kind).some((r) => r.kind === "supplier_invoice")).toBe(false);
    expect(
      requirementGuidance({ label: "Supplier invoice" }, kind)!.whyAmazonWantsIt,
    ).toBeUndefined();
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

/**
 * The rule behind the fix above, stated as data rather than as a judgement: a reason is shown on an
 * unclassified case only when every violation asking for that record gives the same reason. Chosen
 * after measuring the matrix — most kinds carry several different reasons, so borrowing one is a
 * guess far more often than not.
 */
describe("record-level reasons", () => {
  it("shows a reason on an unclassified case only where the matrix agrees on it", () => {
    const kinds = new Set<string>();
    for (const list of Object.values(EVIDENCE_MATRIX)) for (const r of list) kinds.add(r.kind);

    for (const kind of kinds) {
      const reasons = new Set<string>();
      for (const list of Object.values(EVIDENCE_MATRIX)) {
        for (const r of list)
          if (r.kind === kind && r.whyAmazonWantsIt) reasons.add(r.whyAmazonWantsIt);
      }
      const shown = requirementGuidance(
        { evidenceKind: kind as never, label: "x" },
        "UNKNOWN",
      )?.whyAmazonWantsIt;
      if (reasons.size === 1) expect(shown, kind).toBe([...reasons][0]);
      else expect(shown, kind).toBeUndefined();
    }
  });

  it("is not vacuous — the matrix really does disagree for most records", () => {
    // If this ever fails because every kind agrees, the rule above has become a no-op and the
    // simpler "always show it" would be correct again.
    const disagreeing = new Set<string>();
    const seen = new Map<string, Set<string>>();
    for (const list of Object.values(EVIDENCE_MATRIX)) {
      for (const r of list) {
        if (!r.whyAmazonWantsIt) continue;
        if (!seen.has(r.kind)) seen.set(r.kind, new Set());
        seen.get(r.kind)!.add(r.whyAmazonWantsIt);
      }
    }
    for (const [kind, reasons] of seen) if (reasons.size > 1) disagreeing.add(kind);
    expect(disagreeing.size).toBeGreaterThan(0);
  });
});
