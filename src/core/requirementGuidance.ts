/**
 * What the product knows about a requested record, beyond its name.
 *
 * Everything here was already built, tested, and reachable by nobody. The 22 Sep gap audit found
 * five such features behind one door: `whyAmazonWantsIt` (A-05) was rendered only by the dev-only
 * gallery; the three EF-4 outreach letters (A-06) could be reached by no seller; `alternativesFor`
 * (A-02) was called only by the retired interview's step engine, so the founder's own scenario —
 * "the checklist says obtain a compliant invoice, the seller says I can't" — ended in a blank wall.
 *
 * This module is the bridge, and it is deliberately one module rather than five wirings: a seller
 * asking "what is this, why do they want it, how do I get it, and what if I can't" is asking one
 * question. `requirementEvidenceKind` connects a workspace requirement to the evidence matrix;
 * everything below reads from the existing sources rather than restating them.
 *
 * Nothing here is generated, and nothing predicts what Amazon will do.
 */
import { requirementsFor, EVIDENCE_MATRIX } from "./evidenceModel";
import type { EvidenceKind, EvidenceRequirement } from "./evidenceModel";
import { lettersForEvidenceKind } from "./letters";
import type { LetterTemplate } from "./letters";
import { requirementEvidenceKind, type Requirement } from "./workspace";
import type { ViolationKind } from "./index";

export interface RequirementAlternative {
  id: string;
  label: string;
  /** What this path actually says on the seller's behalf. */
  honestyNote: string;
  /** What it costs them. Stated plainly, never softened, and never a probability. */
  consequence: string;
}

export interface RequirementGuidance {
  evidenceKind: EvidenceKind;
  /** The one honest sentence explaining why Amazon asks. EF-1 made it a required matrix field. */
  whyAmazonWantsIt?: string;
  /** What a compliant record has to contain. */
  fields: string[];
  /** What will not pass, which is the half sellers most often get wrong. */
  disqualifiers: string[];
  /** Letters the seller sends themselves. The product never sends anything. */
  letters: LetterTemplate[];
  /** What to do when the record cannot be obtained at all. */
  alternatives: RequirementAlternative[];
}

/**
 * Recovered from `interviewEngine.ts` before it was deleted (`git show
 * 37d606b:src/core/interviewEngine.ts`), where it was consultant-reviewed content reachable only
 * through the dead step engine. Kept as data rather than prose so the consequence of each path is
 * stated once and cannot drift between surfaces.
 */
export function alternativesFor(kind: EvidenceKind): RequirementAlternative[] {
  const alternatives: RequirementAlternative[] = [];

  if (kind === "supplier_invoice") {
    alternatives.push({
      id: "sourcing_change",
      label: "Change sourcing, and say so",
      honestyNote:
        "This path states plainly that you cannot obtain the invoice and are changing supplier, rather than implying the record exists.",
      consequence:
        "Amazon commonly asks for the invoice again. This path rests on a weaker evidentiary footing than producing one.",
    });
  }

  if (kind === "rights_owner_retraction" || kind === "brand_authorization") {
    alternatives.push({
      id: "await_rights_owner",
      label: "Record that the rights owner has not replied",
      honestyNote:
        "This path states that you asked and have had no answer, with the date you asked, rather than claiming a retraction you do not have.",
      consequence:
        "Nothing moves until the rights owner replies. The response names the gap instead of filling it.",
    });
  }

  alternatives.push({
    id: "decline_proceed",
    label: "Continue without this record",
    honestyNote: "The response names this record as missing, in your own words, and proceeds.",
    consequence: `A missing ${kind.replace(/_/g, " ")} weakens the response, and your draft stays a working draft rather than a complete one.`,
  });

  return alternatives;
}

/**
 * The first matrix entry that describes this record, in the matrix's own declaration order. Used
 * only for an unclassified case: it answers "what is this record and what must it show", which is
 * a property of the record rather than of any one violation.
 */
function canonicalRequirement(kind: EvidenceKind): EvidenceRequirement | undefined {
  for (const requirements of Object.values(EVIDENCE_MATRIX)) {
    const match = requirements.find((r) => r.kind === kind);
    if (match) return match;
  }
  return undefined;
}

/**
 * Guidance for a workspace requirement, or `undefined` when the seller added it by hand and it
 * matches no known evidence kind. Undefined is a normal answer: the requirement still works, it
 * simply has nothing behind it, and the caller shows nothing rather than inventing something.
 *
 * `violationKind` narrows `whyAmazonWantsIt` to the matrix entry for this case where one exists;
 * a record can be requested for reasons that differ by violation, and the wrong sentence is worse
 * than no sentence.
 */
export function requirementGuidance(
  /**
   * The requirement itself, not its label. Taking a string meant guidance was recovered by matching
   * a display name, which silently returned nothing for six of the model's eleven kinds and would
   * have broken for any record a seller renamed. `requirementEvidenceKind` prefers the stored kind
   * and falls back to the label for cases saved before that field existed.
   */
  requirement: Pick<Requirement, "label"> & Partial<Pick<Requirement, "evidenceKind">>,
  violationKind: ViolationKind,
): RequirementGuidance | undefined {
  const evidenceKind = requirementEvidenceKind(requirement);
  if (!evidenceKind) return undefined;
  const own = requirementsFor(violationKind).find((r) => r.kind === evidenceKind);
  /*
    `EVIDENCE_MATRIX.UNKNOWN` is an empty array, and a case started by typing a notice straight into
    `/case` — rather than arriving from a decode — is `UNKNOWN`. Without this fallback the whole
    evidence matrix, which is EF-1's central asset, would be invisible on the most ordinary path
    into the product: exactly the "built and unreachable" failure this pass exists to end. Found by
    the e2e test for this feature, not by reading the code.

    Scoped deliberately to `UNKNOWN` only. When a case *is* classified and its matrix has no entry
    for this record, Amazon is asking for something that violation does not normally call for, and
    silence is the honest answer — borrowing another violation's sentence would put a wrong reason
    on screen, and some are violation-coloured (the identity-document sentence talks about funds
    release, which would read as nonsense on a verification case).
  */
  const match: EvidenceRequirement | undefined =
    own ?? (violationKind === "UNKNOWN" ? canonicalRequirement(evidenceKind) : undefined);
  return {
    evidenceKind,
    whyAmazonWantsIt: match?.whyAmazonWantsIt,
    fields: match?.fields ?? [],
    disqualifiers: match?.disqualifiers ?? [],
    letters: lettersForEvidenceKind(evidenceKind),
    alternatives: alternativesFor(evidenceKind),
  };
}
