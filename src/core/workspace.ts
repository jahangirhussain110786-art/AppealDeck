import type { CaseFile } from "./caseFile";
import type { PoaDraft } from "./composer";
import { determineResponseType, describesThePast } from "./responseType";
import type { ResponseType } from "./responseType";
import type { EvidenceKind } from "./evidenceModel";
import { requirementsFor } from "./evidenceModel";
import type { ViolationKind } from "./violationKinds";
import { D6_GATED_ALLEGATION } from "./violationKinds";
import type { NoticeIssue } from "./noticeIssues";
import { detectIssues, hasMultipleIssues } from "./noticeIssues";
import type { SavedDocumentCheck } from "./documentCheck";
import { questionsIn } from "./questionnaire";

/**
 * AA-39 (AM-26) added `verification`, `questionnaire` and `acknowledgement`. Before that, a notice
 * asking for any of the three fell through to `clarification` — a dead end that told a seller in a
 * crisis to go and work it out for themselves. Each new protocol still carries guidance, a
 * requirement list and a deadline; what differs is whether drafting prose is the right output.
 */
export const PROTOCOL_LABELS = {
  documents: "Document response",
  operational: "Plan of Action",
  questionnaire: "Questionnaire response",
  acknowledgement: "Acknowledgement",
  verification: "Identity or business verification",
  dispute: "Disputed allegation",
  information: "Informational update",
  clarification: "Clarification needed",
  specialist: "Professional review",
} as const;
export type Protocol = keyof typeof PROTOCOL_LABELS;

/**
 * Tuple form for schema validators, so adding a protocol above cannot leave `workspaceSchema.ts`
 * silently rejecting it — the same class of drift AA-39 found across six copies of the kind list.
 */
export const PROTOCOLS = Object.keys(PROTOCOL_LABELS) as [Protocol, ...Protocol[]];

/**
 * Protocols where producing written text is the correct output. `verification` is deliberately
 * excluded: those requests are answered by submitting a named document or attending a call, and
 * offering a draft there would encourage a seller to send prose where Amazon wants a passport scan.
 */
export const COMPOSABLE_PROTOCOLS: ReadonlyArray<Protocol> = [
  "documents",
  "operational",
  "questionnaire",
  "acknowledgement",
];
export type Requirement = {
  id: string;
  label: string;
  sourceQuote: string;
  /**
   * `cannot_obtain` added 23 Sep 2026 (A-02/A-03). Until then the only answers a seller could give
   * were "here it is" and "I'm waiting", so someone who genuinely cannot get a compliant invoice —
   * the most common dead end in this product — had no way to say so and stayed blocked forever on
   * a gap they could not clear. AM-17 called handling that objection the moment agencies earn
   * their fee.
   */
  status: "needed" | "waiting" | "reviewed" | "cannot_obtain";
  note: string;
  recordId?: string;
  filename?: string;
  contentHash?: string;
  page?: number;
  /**
   * Why it cannot be obtained, in the seller's own words, and which of the predefined alternatives
   * they chose. Recorded rather than inferred: the response has to state the gap honestly, and a
   * declined item is not the same as a forgotten one (D6).
   */
  declined?: { reason: string; alternativeId?: string; at: string };
  /**
   * B-05, 23 Sep 2026. Where this requirement came from.
   *
   * `"notice"` (the default, and what every requirement was until now) means Amazon named it and
   * `sourceQuote` is their sentence, verbatim. `"matrix"` means **we** raised it: the evidence
   * matrix says this violation family nearly always needs it and the notice did not spell it out.
   * Inferring the unspoken requirement is the expertise being sold, and marking it is what keeps
   * that honest — a seller must always be able to tell Amazon's words from ours.
   *
   * `"seller"` added 23 Sep 2026 with the F+E fix. A seller or appeal writer must be able to record
   * a record they know the case needs even when neither the notice nor our matrix named it —
   * knowing the unnamed requirement is the whole of the expertise being sold, and until today the
   * add-requirement form refused to save one. Like `"matrix"`, it claims no Amazon sentence.
   */
  source?: "notice" | "matrix" | "seller";
  /**
   * Which `EvidenceKind` this record is an instance of, stored rather than re-derived.
   *
   * Added 23 Sep 2026. The kind used to be recovered by matching the label back through a five-
   * entry table, so six of the model's eleven kinds resolved to nothing: their guidance was
   * unreachable, and the "already covered" check could not see them, which duplicated them every
   * time a violation kind was re-applied. A display string is not an identifier, and the day a
   * seller renames a record — or the label map is reworded — is the day the link silently breaks.
   *
   * Optional because cases saved before today have none; `requirementEvidenceKind` falls back to
   * the label for those.
   */
  evidenceKind?: EvidenceKind;
  /**
   * Which request revision `sourceQuote` was taken from. Only meaningful for `"notice"`.
   *
   * Added 23 Sep 2026. `applyWorkspaceReply` replaces `notice` with the reply's text and clears
   * `formInstructions`, so a requirement carried forward from the previous round still held a
   * perfectly good quote from a request that was no longer the current one. Validation checked it
   * against the new notice, failed, and both flagged the requirement and froze it — punishing the
   * seller for Amazon having written back, which is precisely what B-03's "carried" outcome exists
   * to prevent. The quote is now resolved against the revision it came from, which
   * `previousRequests` has stored all along.
   *
   * Optional because cases saved before today have none; `sourceQuoteResolves` reads an absent
   * value as the current revision, which is what it was when those requirements were created.
   */
  sourceRevision?: number;
};
/** See `Workspace.caseFacts`. Every field is optional: a seller states what they know. */
export interface CaseFacts {
  /** The business name exactly as registered on the seller account. */
  businessName?: string;
  /** The registered business address exactly as on the seller account. */
  businessAddress?: string;
  /** Every supplier the seller buys from, as each names itself. Several suppliers are normal. */
  suppliers?: string[];
}

export interface Workspace {
  version: 1;
  revision: number;
  marketplace: "US" | "other";
  notice: string;
  decodedNoticeHash?: string;
  formInstructions: string;
  position: "unsure" | "accept" | "dispute";
  protocol: Protocol;
  confirmed: boolean;
  professionalReviewRequired: boolean;
  requirementsConfirmed: boolean;
  requirements: Requirement[];
  /**
   * #86: every issue the notice raises, not only the one the case routes on. Optional so a case
   * saved before this shipped still loads; populated when the seller confirms the route.
   */
  issues?: NoticeIssue[];
  /**
   * Set when the seller confirms their response covers every issue above. Mirrors
   * `requirementsConfirmed`: the product will not call a response ready while a second issue the
   * notice raised has gone unanswered, because that is refused for the part that was missed.
   */
  issuesConfirmed?: boolean;
  explanation: string;
  correctiveActions: string;
  /**
   * A-01 (EF-2's attestation), wired 23 Sep 2026. A Plan of Action's corrective-actions section is
   * a set of claims about what the seller has actually done, and Amazon treats a claim it later
   * finds untrue far more harshly than an incomplete appeal. The attestation layer was built in
   * `readiness.ts` and reachable by nobody: the only code that could set it was the interview's
   * `applyAnswer`, so `composer.ts`'s `UNATTESTED_CLAIMS` rule could never fire on any real case.
   *
   * Recorded with a timestamp, and cleared whenever the text changes — an attestation that
   * survives an edit is an attestation to something the seller never read.
   */
  correctiveActionsAttested?: { at: string };
  preventiveMeasures: string;
  history: Array<{ id: string; at: string; message: string }>;
  previousRequests: Array<{
    revision: number;
    notice: string;
    formInstructions: string;
    protocol: Protocol;
    requirements: Requirement[];
  }>;
  submissions: Array<{
    id: string;
    at: string;
    revision: number;
    protocol: Protocol;
    text: string;
    receipt: string;
    attachments: Array<{ recordId: string; filename: string; contentHash: string; page: number }>;
    /**
     * #91: `"prior"` marks an attempt the seller made before they found AppealDeck. Absent means
     * recorded through this product, which every row written before this shipped was, so the
     * field is additive and an existing case still reads.
     *
     * Deliberately the same array rather than a parallel one: the attempt count, the
     * duplicate-submission guard, the pre-submit checklist and the history all read
     * `submissions`, and every one of them is wrong if a seller's earlier attempts are invisible
     * to it. Putting them here makes all four correct at once instead of teaching each about a
     * second list.
     */
    source?: "prior";
    /**
     * The response AppealDeck prepared, kept only when the seller sent something different —
     * `text` is always what was actually sent. See `buildSubmission` (lib/submissionRecord.ts).
     */
    preparedText?: string;
    /** What was still open when it was sent, in the page's own words. Never shown as approval. */
    unresolved?: string[];
    /** Share of records reviewed and linked at the time, 0-100, for the opt-in outcome record. */
    readinessAtSubmit?: number;
  }>;
  replies: Array<{ id: string; at: string; text: string; applied: boolean }>;
  /**
   * A questionnaire's answers, one per question as `questionnaireQuestions` reads it. Keyed by the
   * question's own text, so an answer stays with its question if Amazon's form is re-pasted in a
   * different order — and an answer to a question no longer asked is not shown against another.
   */
  answers?: Array<{ question: string; answer: string }>;
  /**
   * Records the seller removed, keyed by `requirementKey`, with the reason they gave. Kept so that
   * reading the notice again — on a correction, or a kind change — does not quietly raise a record
   * the seller has already told us is not wanted.
   */
  dismissed?: Array<{ key: string; label: string; reason: string; at: string }>;
  /**
   * The few facts every document in the case is compared with, stated once by the seller.
   *
   * Added 24 Sep 2026 (ChatGPT audit item G, second half). The facts ledger held the seller's notes
   * under a record's name ("Supplier invoice") and a document's readings under a field's name
   * ("supplier business name"), so the two never met and the contradiction the ledger exists to
   * catch — a narrative that disagrees with its own exhibit — could not be found. Free-text notes
   * cannot be compared honestly; these can. Amazon checks an invoice's buyer name and address
   * against the seller account and may phone the supplier, so these are the facts that matter.
   */
  caseFacts?: CaseFacts;
  /**
   * Document checks kept with the case, one per linked record (24 Sep 2026). A check used to live
   * only in the page's memory, so a paid reading vanished on reload. See `SavedDocumentCheck` for
   * why a saved reading can never be shown beside a different file.
   */
  documentChecks?: SavedDocumentCheck[];
  /** Unsaved field text, autosaved to the vault so it survives navigation and sign-in. */
  draft?: Record<string, string>;
}

export function newWorkspace(): Workspace {
  return {
    version: 1,
    revision: 1,
    marketplace: "US",
    notice: "",
    formInstructions: "",
    position: "unsure",
    protocol: "clarification",
    confirmed: false,
    professionalReviewRequired: false,
    requirementsConfirmed: false,
    requirements: [],
    explanation: "",
    correctiveActions: "",
    preventiveMeasures: "",
    history: [],
    previousRequests: [],
    submissions: [],
    replies: [],
  };
}

/**
 * The records this parser can name, each tied to the `EvidenceKind` it is an instance of.
 *
 * The pairing lives here, beside the only code that produces these labels, because the alternative
 * is a second copy somewhere else that drifts — the mistake #86 was written to avoid when
 * `noticeIssues.ts` was made to read `KIND_PATTERNS` rather than restate it. `evidenceKind` is what
 * lets a workspace requirement reach the evidence matrix: why Amazon asks for it, what disqualifies
 * it, which letter helps obtain it, and what the honest alternatives are if it cannot be obtained.
 *
 * This is **not** B-05. The union with `evidenceModel.requirementsFor()` — raising a requirement
 * Amazon did not spell out — is still unbuilt. This only connects the ones the notice does name.
 */
export const EVIDENCE_KIND_LABELS: Readonly<Record<EvidenceKind, string>> = {
  supplier_invoice: "Supplier invoice",
  brand_authorization: "Authorization letter",
  rights_owner_retraction: "Rights-owner retraction",
  identity_doc: "Requested identity record",
  financial_instrument_doc: "Bank or financial record",
  sourcing_doc: "Sourcing record",
  listing_fix_proof: "Listing correction record",
  disposal_or_recall_proof: "Disposal or recall record",
  metric_export: "Sales or performance record",
  sop_document: "Written procedure",
  compliance_report: "Test report or compliance certificate",
  account_resolution_proof: "Linked-account resolution record",
  other: "Other requested record",
};

/**
 * Tuple form for `workspaceSchema.ts`, derived from the map above exactly as `PROTOCOLS` is derived
 * from `PROTOCOL_LABELS`. A hand-written copy is what AA-39 found in six places and what the schema
 * silently rejects when it falls behind; `EVIDENCE_KIND_LABELS` is `Record<EvidenceKind, string>`,
 * so TypeScript already forces it to be complete.
 */
export const EVIDENCE_KINDS = Object.keys(EVIDENCE_KIND_LABELS) as [
  EvidenceKind,
  ...EvidenceKind[],
];

const CANDIDATE_PATTERNS: ReadonlyArray<{ pattern: RegExp; evidenceKind: EvidenceKind }> = [
  { pattern: /\binvoices?\b/i, evidenceKind: "supplier_invoice" },
  {
    pattern: /\b(letter of authorization|authori[sz]ation letter|LOA)\b/i,
    evidenceKind: "brand_authorization",
  },
  {
    pattern: /\b(identity document|government.issued (?:ID|identification))\b/i,
    evidenceKind: "identity_doc",
  },
  {
    pattern: /\b(sales report|sales records?|order report|metrics? report)\b/i,
    evidenceKind: "metric_export",
  },
  {
    pattern: /\b(proof of (?:correction|changes)|listing screenshots?)\b/i,
    evidenceKind: "listing_fix_proof",
  },
  {
    pattern:
      /\b(test reports?|compliance certificates?|certificates? of (?:conformity|compliance)|lab(?:oratory)? (?:test )?reports?)\b/i,
    evidenceKind: "compliance_report",
  },
];

/** Label comes from the one map, so a candidate and an inferred requirement can never disagree. */
export const REQUIREMENT_CANDIDATES: ReadonlyArray<{
  pattern: RegExp;
  label: string;
  evidenceKind: EvidenceKind;
}> = CANDIDATE_PATTERNS.map((c) => ({ ...c, label: EVIDENCE_KIND_LABELS[c.evidenceKind] }));

/**
 * Every label the model can produce, reversed back to its kind.
 *
 * Built from `EVIDENCE_KIND_LABELS` (all eleven kinds) rather than `REQUIREMENT_CANDIDATES` (the
 * five the parser can spot in prose). Those are different jobs, and conflating them cost six kinds
 * their guidance and made `covered` blind to them — so re-applying a violation kind raised a
 * record the plan already held. Finding a request in a sentence is a parsing problem; identifying a
 * record is an identity problem.
 */
const KIND_BY_LABEL: ReadonlyMap<string, EvidenceKind> = new Map(
  (Object.entries(EVIDENCE_KIND_LABELS) as Array<[EvidenceKind, string]>).map(([kind, label]) => [
    label.toLowerCase(),
    kind,
  ]),
);

/**
 * The evidence kind a requirement's label names, or undefined for one the seller worded themselves.
 * Undefined is a normal answer, not a failure: a hand-added requirement still works, it just has no
 * matrix guidance behind it, and the UI shows nothing rather than guessing.
 *
 * Prefer `requirementEvidenceKind` when you hold the requirement — the stored field survives a
 * seller renaming the record, and this lookup does not.
 */
export function evidenceKindForRequirement(label: string): EvidenceKind | undefined {
  return KIND_BY_LABEL.get(label.trim().toLowerCase());
}

/**
 * The evidence kind of a requirement: what it was created as, falling back to what its label says.
 *
 * The stored field is the answer and the label is the legacy path. A human-readable string was
 * doing the work of an identifier here, which meant a record's identity depended on nobody ever
 * editing its name and on the label map never being reworded — neither of which is a property this
 * model should rely on. Requirements saved before the field existed still resolve through the
 * fallback, so nothing needs migrating.
 */
export function requirementEvidenceKind(
  r: Pick<Requirement, "label"> & Partial<Pick<Requirement, "evidenceKind">>,
): EvidenceKind | undefined {
  return r.evidenceKind ?? evidenceKindForRequirement(r.label);
}

/** Suggest only record names present in an explicit request; seller confirms coverage. */
/**
 * A sentence that says a record is not wanted. Narrower than `responseType.ts`'s list on purpose:
 * that one also drops "rather than" and "without", which costs a response-type decision one
 * supporting quote but would cost this list a real request — "provide invoices rather than order
 * confirmations" asks for invoices. "No further" and "not needed" were missing until 23 Sep 2026,
 * so "no further submission is needed" still raised the record it had just waived.
 */
const REQUIREMENT_NEGATION =
  /\b(do not|don't|does not need|not required|not necessary|not needed|no need to|no longer|no additional|no further)\b/i;

export function proposedRequirements(
  /**
   * `revision` is here so a named requirement records which request its quote came from. Callers
   * that build a synthetic request (a reply being previewed) pass the revision that request will
   * become, not the one it is replacing.
   */
  w: Pick<Workspace, "notice" | "formInstructions" | "revision">,
  /** Omit on surfaces that must show only what Amazon actually said — see the union note below. */
  violationKind?: ViolationKind,
): Requirement[] {
  const sources = `${w.notice}\n${w.formInstructions}`
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length <= 2000 &&
        /\b(provide|submit|upload|send|include|request(?:ed|ing)?)\b/i.test(s) &&
        !REQUIREMENT_NEGATION.test(s) &&
        // "Invoices were requested earlier", "thank you for providing your invoices": the notice
        // describing what already happened. The same rule `determineResponseType` applies.
        !describesThePast(s),
    );
  const named = REQUIREMENT_CANDIDATES.flatMap(({ pattern, label, evidenceKind }) => {
    const sourceQuote = sources.find((s) => pattern.test(s));
    return sourceQuote
      ? [
          {
            id: crypto.randomUUID(),
            label,
            sourceQuote,
            status: "needed" as const,
            note: "",
            source: "notice" as const,
            sourceRevision: w.revision,
            evidenceKind,
          },
        ]
      : [];
  });
  if (!violationKind) return named;

  /*
    B-05, the union the spec has asked for since EF-1: "requirement instances = the notice's own
    list ∪ the reviewed matrix, each carrying ... source".

    Until now `proposedRequirements` used the five regexes above and never consulted
    `evidenceModel.ts`, so a record Amazon did not spell out was never raised — and Amazon routinely
    does not spell it out. Knowing that an inauthenticity case needs a supplier invoice whether or
    not the notice says the word is precisely what a seller pays an appeal writer for.

    Only `required: true` entries, because a matrix "optional" is a suggestion and putting one on a
    seller's list as an obligation would misrepresent it. Each carries `source: "matrix"` and a
    plain statement that we raised it, never a quote — inventing an Amazon sentence for a record
    Amazon never mentioned is the exact dishonesty this model exists to prevent.
  */
  const covered = new Set(named.map(requirementEvidenceKind));
  const inferred = requirementsFor(violationKind)
    .filter((r) => r.required && !covered.has(r.kind))
    .map((r) => ({
      id: crypto.randomUUID(),
      label: EVIDENCE_KIND_LABELS[r.kind],
      sourceQuote: MATRIX_SOURCE_NOTE,
      status: "needed" as const,
      note: "",
      source: "matrix" as const,
      evidenceKind: r.kind,
    }));
  return [...named, ...inferred];
}

/**
 * What stands in for a quote on a requirement the notice never named. Deliberately not a sentence
 * attributed to Amazon: `workspaceGaps` checks that a `"notice"` requirement's quote really appears
 * in the seller's own text, and this one is exempt from that check precisely because it is ours.
 */
export const MATRIX_SOURCE_NOTE =
  "Not named in your notice. Cases like this one are usually refused without it.";

/** What stands in for a quote on a record the seller added from their own knowledge of the case. */
export const SELLER_SOURCE_NOTE = "Added by you. Neither your notice nor our records named it.";

/**
 * The request text a given revision was written against, or `undefined` if we no longer hold it.
 *
 * The current revision is the live notice and form instructions; earlier ones come from
 * `previousRequests`, which `applyWorkspaceReply` has been recording since B-03 and which nothing
 * read until now.
 */
export function requestTextForRevision(
  w: Pick<Workspace, "revision" | "notice" | "formInstructions" | "previousRequests">,
  revision: number,
): string | undefined {
  if (revision === w.revision) return `${w.notice}\n${w.formInstructions}`;
  const prior = w.previousRequests.find((p) => p.revision === revision);
  return prior ? `${prior.notice}\n${prior.formInstructions}` : undefined;
}

/**
 * Whether a requirement's stated source holds up — the single rule both the completeness check and
 * the UI's write path use.
 *
 * One function rather than two copies of an `includes` test, because the two copies is exactly how
 * this broke: `workspaceGaps` was taught about `source: "matrix"` on 23 Sep and `changeRequirement`
 * was not, so an inferred record could be displayed, could be described as needed, and could never
 * be marked reviewed, waiting or unobtainable. The rule and its exceptions now live in one place.
 *
 * Three cases:
 *
 * - **We raised it** (`matrix`) or **the seller raised it** (`seller`) — there is no Amazon sentence
 *   to check, and demanding one is asking for something that cannot honestly exist.
 * - **Amazon named it** — the quote must still appear in the request revision it was taken from,
 *   which catches a quote that has drifted from the seller's own text.
 * - **We no longer hold that revision** — treated as resolved. Blocking a seller because *our*
 *   record of an old request is missing puts the cost of our gap on them, and the thing being
 *   blocked is their own evidence work.
 */
export function sourceQuoteResolves(
  w: Pick<Workspace, "revision" | "notice" | "formInstructions" | "previousRequests">,
  r: Pick<Requirement, "source" | "sourceQuote" | "sourceRevision">,
): boolean {
  if (r.source === "matrix" || r.source === "seller") return true;
  const quote = r.sourceQuote.trim();
  if (!quote) return false;
  const text = requestTextForRevision(w, r.sourceRevision ?? w.revision);
  return text === undefined || text.includes(quote);
}

/**
 * B-06: the requirement list after a seller corrects the decoded violation kind.
 *
 * **Additive, and deliberately so.** Rebuilding the list would delete records the seller has
 * already reviewed, linked to a vault file and written a note about — punishing them for telling us
 * we were wrong, which is the opposite of what a correction mechanism is for. Anything the new kind
 * requires and the list does not have is added as `source: "matrix"`; nothing is removed. The
 * existing "remove from current plan" flow is how a seller drops one that does not apply, and it
 * asks for a reason, which an automatic sweep never could.
 *
 * K12 named "classification-confidence display and user override verified working" as the response
 * to a wrong-classification signal, and there was no mechanism behind it. There is now, and it
 * matters more than it did: since B-05 the kind also decides which unspoken records get raised.
 */
export function requirementsAfterKindChange(
  existing: readonly Requirement[],
  nextKind: ViolationKind,
  /** Records the seller removed. A kind change does not bring them back. */
  dismissed: Workspace["dismissed"] = [],
): Requirement[] {
  const covered = new Set<string | undefined>(existing.map(requirementEvidenceKind));
  for (const d of dismissed) covered.add(d.key);
  const added = requirementsFor(nextKind)
    .filter((r) => r.required && !covered.has(r.kind))
    .map((r) => ({
      id: crypto.randomUUID(),
      label: EVIDENCE_KIND_LABELS[r.kind],
      sourceQuote: MATRIX_SOURCE_NOTE,
      status: "needed" as const,
      note: "",
      source: "matrix" as const,
      evidenceKind: r.kind,
    }));
  return [...existing, ...added];
}

/**
 * The records to hold once the seller confirms a corrected or replaced notice.
 *
 * Added 23 Sep 2026. Confirming the request rebuilt the issues every time but the records only
 * when there were none, so a seller who fixed a mis-pasted notice kept the old list: a record the
 * corrected text asks for never appeared, and one it no longer names kept quoting a sentence that
 * is not there any more. Built on the same rule as a kind change and a reply round — nothing the
 * seller has worked on is removed because we read the notice again.
 *
 * - A record the corrected notice names keeps all of the seller's work and takes the new quote. One
 *   we had only recommended becomes Amazon's, because now it is.
 * - A record the corrected notice raises for the first time is added.
 * - A record from the old text that the new one does not name is dropped only if nothing was done
 *   with it. If the seller had linked a file, written a note or said they cannot get it, it stays,
 *   and `sourceQuoteResolves` flags its quote so they can decide.
 * - Records we recommended and records the seller added are kept as they are.
 *
 * `fresh` is `proposedRequirements` for the corrected text, with the case's kind.
 */
export function requirementsAfterNoticeChange(
  existing: readonly Requirement[],
  fresh: readonly Requirement[],
  /** Records the seller removed, with a reason. Never raised again by reading the notice. */
  dismissed: Workspace["dismissed"] = [],
): Requirement[] {
  const keyFor = requirementKey;
  const removed = new Set(dismissed.map((d) => d.key));
  const freshByKey = new Map(
    fresh.filter((r) => !removed.has(keyFor(r))).map((r) => [keyFor(r), r]),
  );
  const matched = new Set<string>();
  const kept: Requirement[] = [];
  for (const r of existing) {
    const key = keyFor(r);
    const now = freshByKey.get(key);
    if (now) {
      matched.add(key);
      kept.push(
        now.source === "notice"
          ? {
              ...r,
              source: "notice",
              sourceQuote: now.sourceQuote,
              sourceRevision: now.sourceRevision,
              evidenceKind: r.evidenceKind ?? now.evidenceKind,
            }
          : r,
      );
      continue;
    }
    const fromNotice = r.source !== "matrix" && r.source !== "seller";
    const untouched =
      r.status === "needed" && !r.recordId && !r.note.trim() && !r.declined?.reason.trim();
    if (fromNotice && untouched) continue;
    kept.push(r);
  }
  return [...kept, ...[...freshByKey.values()].filter((r) => !matched.has(keyFor(r)))];
}

/**
 * What identifies "the same record" across readings of a notice: its evidence kind when it has
 * one, its label otherwise. The reply comparison uses the same rule.
 */
export function requirementKey(r: Requirement): string {
  return requirementEvidenceKind(r) ?? r.label.toLowerCase();
}

/**
 * #86: the issues a notice raises, ready to store on the case. Kept beside
 * `proposedRequirements` because both answer "what does this notice actually say", and both must
 * be recomputed whenever the notice text changes.
 */
export function proposedIssues(w: Pick<Workspace, "notice" | "formInstructions">): NoticeIssue[] {
  return detectIssues(w.notice, w.formInstructions);
}

/** A bounded routing aid, never a claim about hidden platform decisions. */
export function routeWorkspace(
  w: Pick<Workspace, "notice" | "formInstructions" | "position" | "marketplace"> &
    Partial<Pick<Workspace, "professionalReviewRequired">>,
): { protocol: Protocol; reason: string } {
  if (w.professionalReviewRequired)
    return {
      protocol: "specialist",
      reason:
        "An earlier confirmed request in this case requires professional review. A later reply does not remove that requirement.",
    };
  const text = `${w.notice}\n${w.formInstructions}`;
  /**
   * D6 severity gating, and nothing beyond it. The 21 Sep 2026 commercial review established that
   * this test had silently grown to cover product safety, related accounts and every intellectual-
   * property notice — categories D6 never named — which made the product refuse to help the sellers
   * it was built for. D6 gates exactly three things: fabricated documents, fraud, and child safety.
   * Widening this again requires a founder decision and an amendment, not a regex edit.
   */
  // The same rule the classifier gates on — see `D6_GATED_ALLEGATION`. It lived here as a literal
  // and in `noticeParser` as a wider one, and the two disagreed about the most common case there is.
  if (D6_GATED_ALLEGATION.test(text))
    return {
      protocol: "specialist",
      reason:
        "The notice alleges fabricated documents, fraud, or a child-safety matter. We do not prepare responses to these, because getting one wrong carries consequences a draft cannot undo — this needs qualified help.",
    };
  if (w.marketplace !== "US")
    return {
      protocol: "clarification",
      reason: "This workspace currently supports English-language Amazon US requests.",
    };
  /**
   * Verification now has a home of its own. It used to land in `clarification` with an instruction
   * to go and read Seller Central, which is the dead end AM-26 point 2 exists to remove.
   */
  if (
    /\b(identity verification|verify your identity|video (?:call|interview)|government.issued (?:ID|identification)|INFORM Consumers Act|re-?certif(?:y|ication))\b/i.test(
      text,
    )
  )
    return {
      protocol: "verification",
      reason:
        "This is a verification request, not a policy appeal. Amazon wants to confirm who you are or that your business details are genuine, so the answer is the specific document or step it names — a Plan of Action is the wrong response here and can delay things.",
    };
  if (w.position === "dispute")
    return {
      protocol: "dispute",
      reason:
        "Your disagreement is preserved. Organize your facts for qualified review before choosing dispute grounds.",
    };
  if (w.notice.trim().length < 30)
    return {
      protocol: "clarification",
      reason: "Add the full notice and what the current response page asks you to provide.",
    };
  /**
   * AA-39: the route is now decided by `determineResponseType`, the same function `/decode` uses,
   * rather than by a second set of regexes maintained here. Two copies of this logic had already
   * drifted apart, which meant the free decoder and the workspace could tell one seller two
   * different things about the same notice.
   *
   * 25 Sep 2026: and they still did. An empty response-page field sent every case to
   * "Clarification needed", so a seller told "Plan of Action" by /decode was told something else
   * one click later and blocked on a field most sellers do not understand. The notice alone now
   * decides, exactly as it does on /decode, and the reason says the response page can still
   * change it. A notice that really is unclear still lands in clarification through the decision.
   */
  const decision = determineResponseType(w.notice, w.formInstructions);
  const reason = w.formInstructions.trim()
    ? decision.reason
    : `${decision.reason} This is read from your notice alone. If the response page in Seller Central asks for something different, add what it says and the route updates.`;
  return { protocol: PROTOCOL_FOR_RESPONSE_TYPE[decision.type], reason };
}

/** Heading used for the seller's written answer, per protocol. `operational` is handled separately
 * because it is the only one with three distinct sections. */
const RESPONSE_HEADING: Partial<Record<Protocol, string>> = {
  documents: "Response to the document request",
  questionnaire: "Answers to Amazon's questions",
  acknowledgement: "Your acknowledgement",
};

const PROTOCOL_FOR_RESPONSE_TYPE: Record<ResponseType, Protocol> = {
  PLAN_OF_ACTION: "operational",
  SUPPORTING_DOCUMENTS: "documents",
  QUESTIONNAIRE: "questionnaire",
  ACKNOWLEDGEMENT: "acknowledgement",
  NO_ACTION_REQUESTED: "information",
  UNDETERMINED: "clarification",
};

/**
 * #91: what the seller already sent, before they found this product.
 *
 * A seller usually arrives after appealing once or twice on their own and being rejected — that
 * is what sends them looking for help. Until now the product could not know: the attempt count
 * was `submissions.length`, which counts only what was recorded here, so a third attempt was
 * treated as a first. Everything downstream inherited the mistake. `noveltyRequired()` never
 * fired, so nobody was told the response has to differ from the one already refused. The
 * duplicate-submission guard — built precisely because repeat-submission-without-change is the
 * best-evidenced rejection cause in the research — had nothing to compare against. And the
 * composer wrote as if this were a first appeal.
 *
 * The seller may not still have the text. That is fine and expected: the count alone fixes the
 * attempt number and the novelty requirement, and an empty text simply gives the guard nothing to
 * compare, which is honest rather than a guess.
 */
export interface PriorAttemptInput {
  /** ISO timestamp the seller says they sent it. */
  at: string;
  /** What they sent, if they still have it. Empty is allowed and common. */
  text: string;
}

/**
 * Records an attempt made before this case existed. `revision: 0` marks it as predating the
 * workspace's own first revision, so it can never be confused with something drafted here.
 */
export function recordPriorAttempt(w: Workspace, input: PriorAttemptInput): Workspace {
  const at = input.at.trim() || new Date(0).toISOString();
  return {
    ...w,
    submissions: [
      ...w.submissions,
      {
        id: crypto.randomUUID(),
        at,
        revision: 0,
        protocol: w.protocol,
        text: input.text.trim(),
        receipt: "",
        attachments: [],
        source: "prior",
      },
    ],
    history: [
      ...w.history,
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        message: "Recorded a response sent before this case was created.",
      },
    ],
  };
}

/** Removes a prior attempt the seller added by mistake. Never touches a real submission. */
export function removePriorAttempt(w: Workspace, id: string): Workspace {
  return {
    ...w,
    submissions: w.submissions.filter((s) => !(s.id === id && s.source === "prior")),
  };
}

/** Attempts the seller made before this case existed. */
export function priorAttempts(w: Workspace) {
  return w.submissions.filter((s) => s.source === "prior");
}

/**
 * Every attempt against this notice, whether it was sent through this product or before it. This
 * is the number that decides whether a response has to differ from what was already refused, so
 * it must not be `submissions.length` filtered to our own rows.
 */
export function totalAttempts(w: Workspace): number {
  return w.submissions.length;
}

/** The questions this case's questionnaire asks, response page first. Empty for any other protocol. */
export function questionnaireQuestions(
  w: Pick<Workspace, "protocol" | "formInstructions" | "notice">,
): string[] {
  if (w.protocol !== "questionnaire") return [];
  return questionsIn(`${w.formInstructions}\n${w.notice}`);
}

export function answerFor(w: Pick<Workspace, "answers">, question: string): string {
  return w.answers?.find((a) => a.question === question)?.answer ?? "";
}

export function workspaceGaps(w: Workspace): string[] {
  const gaps: string[] = [];
  const route = routeWorkspace(w);
  if (!w.confirmed || route.protocol !== w.protocol)
    gaps.push("Confirm the requested route against your notice and the response page.");
  if (!COMPOSABLE_PROTOCOLS.includes(route.protocol)) gaps.push(route.reason);
  if (!w.requirementsConfirmed)
    gaps.push(
      "Confirm that the list covers every item requested by your notice and the response page.",
    );
  /*
    #86: a notice that raises two issues is refused for the one the response missed, so a case is
    not ready while a second issue is unaddressed. Only fires when more than one was actually
    found — a single-issue notice behaves exactly as it always has.
  */
  if (hasMultipleIssues(w.issues ?? []) && !w.issuesConfirmed)
    gaps.push(
      `This notice raises ${(w.issues ?? []).length} separate issues. Confirm your response addresses each one.`,
    );
  if (w.protocol === "documents" && !w.requirements.length)
    gaps.push("Add the requested document to your plan.");
  for (const r of w.requirements) {
    if (r.status === "cannot_obtain" && r.declined?.reason.trim()) {
      /*
        A-02: a record the seller has told us they cannot obtain is still a gap — the evidence is
        genuinely absent and the draft must stay a working draft. But it is an *acknowledged* gap,
        and saying "review and link evidence" to someone who has already explained they cannot get
        it is the dead end this feature exists to remove. The response names it in their words.
      */
      gaps.push(`Named as unobtainable, and stated in the response: ${r.label}`);
    } else if (
      r.status !== "reviewed" ||
      !r.recordId ||
      !r.filename ||
      !r.contentHash ||
      !r.page ||
      !r.note.trim()
    )
      gaps.push(`Review and link evidence for: ${r.label}`);
    // Shared with the UI's write path — see `sourceQuoteResolves`. This check used to inline its
    // own `includes` test against the *current* notice only, which flagged every requirement
    // carried through a reply round.
    if (!sourceQuoteResolves(w, r)) gaps.push(`Check the source of the request for: ${r.label}`);
  }
  /*
    What the written part must contain depends on what was asked (audit item L, 23 Sep 2026). A
    single 40-character minimum was applied to every protocol, which kept a correct one-line
    acknowledgement a "working draft" forever while accepting any 40 characters of anything.
  */
  const questions = questionnaireQuestions(w);
  if (questions.length) {
    for (const q of questions) {
      if (!answerFor(w, q).trim()) gaps.push(`Answer the question: ${q}`);
    }
  } else if (w.protocol === "acknowledgement") {
    if (!w.explanation.trim()) gaps.push("Write the acknowledgement Amazon asked for.");
  } else if (w.explanation.trim().length < 40) {
    gaps.push(
      w.protocol === "operational"
        ? "Describe the specific root cause."
        : "Explain how the supplied records answer the request.",
    );
  }
  if (w.protocol === "operational") {
    if (w.correctiveActions.trim().length < 40)
      gaps.push("Describe corrective actions, distinguishing completed work from plans.");
    if (w.preventiveMeasures.trim().length < 40)
      gaps.push("Describe the preventive process and its adoption status.");
  }
  if (w.replies.some((r) => !r.applied))
    gaps.push("Review the new reply before preparing another response.");
  return gaps;
}

export function workspaceCanCompose(w: Workspace): boolean {
  return (
    COMPOSABLE_PROTOCOLS.includes(routeWorkspace(w).protocol) &&
    w.confirmed &&
    routeWorkspace(w).protocol === w.protocol
  );
}

export function composeWorkspace(
  file: Pick<CaseFile, "kind"> & { workspace: Workspace },
  attemptNumber: number,
): PoaDraft {
  const w = file.workspace;
  const gaps = workspaceGaps(w);
  // AA-39: each composable protocol gets its own heading. A questionnaire answered under a heading
  // that says "response to the document request" reads as though the seller misunderstood the ask.
  const questions = questionnaireQuestions(w);
  const sections =
    w.protocol === "operational"
      ? [
          { heading: "Root Cause", body: w.explanation },
          { heading: "Corrective Actions", body: w.correctiveActions },
          { heading: "Preventive Measures", body: w.preventiveMeasures },
        ]
      : questions.length
        ? // Answered in Amazon's order, each under its own question (audit item L).
          [
            ...questions.map((q) => ({
              heading: q,
              body: answerFor(w, q) || "(not answered yet)",
            })),
            ...(w.explanation.trim()
              ? [{ heading: "Additional context", body: w.explanation }]
              : []),
          ]
        : [{ heading: RESPONSE_HEADING[w.protocol] ?? "Your response", body: w.explanation }];
  sections.push({
    heading: "Supporting records",
    body:
      w.requirements
        .filter((r) => r.status === "reviewed" && r.filename)
        .map((r) => `${r.filename}, page ${r.page}: ${r.note}`)
        .join("\n") || "No reviewed records linked.",
  });
  /*
    A-02: a record the seller cannot obtain is stated in the response, in their own words, rather
    than left as a silent hole for Amazon to notice. Its own section, because a reader must not
    mistake a declared gap for a supplied record — that is the distinction the whole feature turns
    on, and the reason the decline is recorded rather than inferred.
  */
  const declined = w.requirements.filter(
    (r) => r.status === "cannot_obtain" && r.declined?.reason.trim(),
  );
  if (declined.length)
    sections.push({
      heading: "Records I could not obtain",
      body: declined.map((r) => `${r.label}: ${r.declined!.reason.trim()}`).join("\n"),
    });
  if (gaps.length)
    sections.push({ heading: "Unresolved items — working notes", body: gaps.join("\n") });
  return {
    docType: w.protocol === "operational" ? "poa" : "document_response",
    mode: {
      mode: gaps.length ? "gap-draft" : "full-draft",
      reason: gaps.length
        ? "Resolve the listed items before submitting."
        : "Ready for your final factual review.",
    },
    sections,
    watermark: gaps.length ? "WORK IN PROGRESS — NOT READY TO SUBMIT" : undefined,
    metadata: {
      generatedAt: new Date().toISOString(),
      kind: file.kind,
      evidenceComplete: !gaps.length,
      attemptNumber,
      aiDrafted: false,
    },
  };
}

export function addWorkspaceEvent(w: Workspace, message: string): Workspace {
  return {
    ...w,
    history: [
      ...w.history,
      { id: crypto.randomUUID(), at: new Date().toISOString(), message },
    ].slice(-200),
  };
}

/**
 * B-03, the reply delta. What each requirement becomes when an Amazon reply starts a new revision.
 *
 * Until 23 Sep 2026 this step reset **every** requirement to `"needed"`, so a seller redid their
 * entire evidence review each time Amazon replied. The median real case is multi-round, which made
 * the product most useless exactly where it promised to save the most labour.
 *
 * Four outcomes, and each means one thing:
 *
 * - `reopened` — you marked it reviewed and Amazon is asking for it **again**. This is the one that
 *   matters, and it is also the only honest reading of "conflict": a second request for something
 *   already supplied usually means it was rejected or was not enough. Status returns to `needed`.
 * - `added` — the reply asks for something this case did not have.
 * - `outstanding` — still not reviewed, so nothing changes whether the reply repeats it or not.
 *   Amazon declining to repeat a request does not withdraw it, and we must not imply it does.
 * - `carried` — reviewed, and this reply does not mention it. **Kept reviewed.** This is the work
 *   that used to be destroyed.
 *
 * Matching is by label, because `proposedRequirements()` issues a fresh `id` on every call, and the
 * existing requirement carries the seller's real work — the linked vault record, the filename, the
 * content hash, the page and their note. Those ride through untouched on every outcome.
 */
export type ReplyChange = "reopened" | "added" | "outstanding" | "carried";

export interface ReplyDeltaItem {
  change: ReplyChange;
  /** The requirement as it will stand once this delta is applied. */
  requirement: Requirement;
  /** The reply's own sentence that raised it, verbatim, when the reply raised it at all. */
  replyQuote?: string;
}

export interface ReplyDelta {
  replyId: string;
  items: ReplyDeltaItem[];
  /** The requirement list the workspace will hold. Order: existing first, then anything new. */
  requirements: Requirement[];
}

export function computeReplyDelta(w: Workspace, replyId: string): ReplyDelta | null {
  const reply = w.replies.find((r) => r.id === replyId);
  if (!reply || reply.applied) return null;

  /*
    The revision this reply will become once applied. Every quote taken from the reply's own text
    belongs to it, not to the request it replaces, and stamping it here is what lets a carried
    requirement still resolve afterwards — `applyWorkspaceReply` moves the old notice into
    `previousRequests` under `w.revision`, so both halves of the pair stay findable.
  */
  const nextRevision = w.revision + 1;
  const asked = proposedRequirements({
    notice: reply.text,
    formInstructions: "",
    revision: nextRevision,
  });
  /*
    Matched on the typed evidence kind where both sides have one, falling back to the label.
    B-03 matched on the label alone because `proposedRequirements` issues a fresh id per call while
    the existing requirement carries the seller's real work — that reasoning still holds, but a
    display string is a poor key: rename a record and Amazon asking for it again would read as a
    brand-new requirement, silently orphaning the file and note already attached to it.
  */
  const keyFor = (r: Requirement) => requirementEvidenceKind(r) ?? r.label.toLowerCase();
  const askedByLabel = new Map(asked.map((r) => [keyFor(r), r]));
  const items: ReplyDeltaItem[] = [];
  const matched = new Set<string>();

  /*
    A requirement saved before `sourceRevision` existed has a quote from the request that is current
    right now, so that is what it is stamped with on the way past. Doing it here rather than in a
    migration means the backfill happens exactly when the value stops being inferable — one step
    later, the old notice is no longer the current one and the information is gone.
  */
  const held = (existing: Requirement) => existing.sourceRevision ?? w.revision;

  for (const existing of w.requirements) {
    const key = keyFor(existing);
    const askedAgain = askedByLabel.get(key);
    if (askedAgain) matched.add(key);
    if (existing.status === "reviewed" && askedAgain) {
      items.push({
        change: "reopened",
        // The source quote moves to the reply's wording, because that is the request now open.
        requirement: {
          ...existing,
          status: "needed",
          sourceQuote: askedAgain.sourceQuote,
          sourceRevision: nextRevision,
        },
        replyQuote: askedAgain.sourceQuote,
      });
    } else if (existing.status === "reviewed") {
      items.push({
        change: "carried",
        requirement: { ...existing, sourceRevision: held(existing) },
      });
    } else {
      items.push({
        change: "outstanding",
        requirement: askedAgain
          ? { ...existing, sourceQuote: askedAgain.sourceQuote, sourceRevision: nextRevision }
          : { ...existing, sourceRevision: held(existing) },
        replyQuote: askedAgain?.sourceQuote,
      });
    }
  }

  for (const a of asked) {
    if (matched.has(keyFor(a))) continue;
    items.push({ change: "added", requirement: a, replyQuote: a.sourceQuote });
  }

  return { replyId, items, requirements: items.map((i) => i.requirement) };
}

/** How many of each outcome a delta holds — for the summary a seller confirms against. */
export function replyDeltaCounts(delta: ReplyDelta): Record<ReplyChange, number> {
  const counts: Record<ReplyChange, number> = {
    reopened: 0,
    added: 0,
    outstanding: 0,
    carried: 0,
  };
  for (const item of delta.items) counts[item.change] += 1;
  return counts;
}

/** Confirmed reply revisions preserve every earlier submission and file reference. */
export function applyWorkspaceReply(w: Workspace, replyId: string): Workspace {
  const reply = w.replies.find((r) => r.id === replyId);
  if (!reply || reply.applied) return w;
  const delta = computeReplyDelta(w, replyId);
  const counts = delta ? replyDeltaCounts(delta) : null;
  const updated = {
    ...w,
    previousRequests: [
      ...w.previousRequests,
      {
        revision: w.revision,
        notice: w.notice,
        formInstructions: w.formInstructions,
        protocol: w.protocol,
        requirements: structuredClone(w.requirements),
      },
    ],
    revision: w.revision + 1,
    notice: reply.text,
    confirmed: false,
    requirementsConfirmed: false,
    formInstructions: "",
    requirements: delta ? delta.requirements : w.requirements,
    replies: w.replies.map((r) => (r.id === replyId ? { ...r, applied: true } : r)),
  };
  return addWorkspaceEvent(
    updated,
    counts
      ? `Started a new revision from the reply. Asked for again: ${counts.reopened}. New in this reply: ${counts.added}. Still on your list: ${counts.outstanding}. Kept as reviewed: ${counts.carried}. Check the response page in Seller Central.`
      : "Started a new revision from the reply. Check the response page in Seller Central and your records list.",
  );
}
