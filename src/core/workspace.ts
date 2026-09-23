import type { CaseFile } from "./caseFile";
import type { PoaDraft } from "./composer";
import { determineResponseType } from "./responseType";
import type { ResponseType } from "./responseType";
import type { EvidenceKind } from "./evidenceModel";
import type { NoticeIssue } from "./noticeIssues";
import { detectIssues, hasMultipleIssues } from "./noticeIssues";

/**
 * AA-39 (AM-26) added `verification`, `questionnaire` and `acknowledgement`. Before that, a notice
 * asking for any of the three fell through to `clarification` — a dead end that told a seller in a
 * crisis to go and work it out for themselves. Each new protocol still carries guidance, a
 * requirement list and a deadline; what differs is whether drafting prose is the right output.
 */
export const PROTOCOL_LABELS = {
  documents: "Document response",
  operational: "Operational Plan of Action",
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
};
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
  }>;
  replies: Array<{ id: string; at: string; text: string; applied: boolean }>;
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
export const REQUIREMENT_CANDIDATES: ReadonlyArray<{
  pattern: RegExp;
  label: string;
  evidenceKind: EvidenceKind;
}> = [
  { pattern: /\binvoices?\b/i, label: "Supplier invoice", evidenceKind: "supplier_invoice" },
  {
    pattern: /\b(letter of authorization|authori[sz]ation letter|LOA)\b/i,
    label: "Authorization letter",
    evidenceKind: "brand_authorization",
  },
  {
    pattern: /\b(identity document|government.issued (?:ID|identification))\b/i,
    label: "Requested identity record",
    evidenceKind: "identity_doc",
  },
  {
    pattern: /\b(sales report|sales records?|order report|metrics? report)\b/i,
    label: "Sales or performance record",
    evidenceKind: "metric_export",
  },
  {
    pattern: /\b(proof of (?:correction|changes)|listing screenshots?)\b/i,
    label: "Listing correction record",
    evidenceKind: "listing_fix_proof",
  },
];

/**
 * The evidence kind a requirement is an instance of, or undefined for one the seller added by
 * hand. Undefined is a normal answer, not a failure: a hand-added requirement still works, it just
 * has no matrix guidance behind it, and the UI shows nothing rather than guessing.
 */
export function evidenceKindForRequirement(label: string): EvidenceKind | undefined {
  return REQUIREMENT_CANDIDATES.find((c) => c.label.toLowerCase() === label.toLowerCase())
    ?.evidenceKind;
}

/** Suggest only record names present in an explicit request; seller confirms coverage. */
export function proposedRequirements(
  w: Pick<Workspace, "notice" | "formInstructions">,
): Requirement[] {
  const sources = `${w.notice}\n${w.formInstructions}`
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length <= 2000 &&
        /\b(provide|submit|upload|send|include|request(?:ed|ing)?)\b/i.test(s) &&
        !/\b(do not|don't|not required|no need to|no additional)\b/i.test(s),
    );
  return REQUIREMENT_CANDIDATES.flatMap(({ pattern, label }) => {
    const sourceQuote = sources.find((s) => pattern.test(s));
    return sourceQuote
      ? [{ id: crypto.randomUUID(), label, sourceQuote, status: "needed" as const, note: "" }]
      : [];
  });
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
  if (
    /\b(forged|falsified|fabricated|manipulated|altered)\s+(documents?|invoices?)|\b(fraud|child safety)\b/i.test(
      text,
    )
  )
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
  if (w.notice.trim().length < 30 || !w.formInstructions.trim())
    return {
      protocol: "clarification",
      reason:
        w.notice.trim().length < 30
          ? "Add the full notice and what the current response page asks you to provide."
          : "Add what the current response page asks you to provide to confirm the route.",
    };
  /**
   * AA-39: the route is now decided by `determineResponseType`, the same function `/decode` uses,
   * rather than by a second set of regexes maintained here. Two copies of this logic had already
   * drifted apart, which meant the free decoder and the workspace could tell one seller two
   * different things about the same notice.
   */
  const decision = determineResponseType(w.notice, w.formInstructions);
  return { protocol: PROTOCOL_FOR_RESPONSE_TYPE[decision.type], reason: decision.reason };
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

export function workspaceGaps(w: Workspace): string[] {
  const gaps: string[] = [];
  const route = routeWorkspace(w);
  if (!w.confirmed || route.protocol !== w.protocol)
    gaps.push("Confirm the requested route against the notice and form.");
  if (!COMPOSABLE_PROTOCOLS.includes(route.protocol)) gaps.push(route.reason);
  if (!w.requirementsConfirmed)
    gaps.push("Confirm that the list covers every item requested by the notice and form.");
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
    if (!`${w.notice}\n${w.formInstructions}`.includes(r.sourceQuote) || !r.sourceQuote.trim())
      gaps.push(`Check the source of the request for: ${r.label}`);
  }
  if (w.explanation.trim().length < 40)
    gaps.push(
      w.protocol === "operational"
        ? "Describe the specific root cause."
        : "Explain how the supplied records answer the request.",
    );
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
  const sections =
    w.protocol === "operational"
      ? [
          { heading: "Root Cause", body: w.explanation },
          { heading: "Corrective Actions", body: w.correctiveActions },
          { heading: "Preventive Measures", body: w.preventiveMeasures },
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

  const asked = proposedRequirements({ notice: reply.text, formInstructions: "" });
  const askedByLabel = new Map(asked.map((r) => [r.label.toLowerCase(), r]));
  const items: ReplyDeltaItem[] = [];
  const matched = new Set<string>();

  for (const existing of w.requirements) {
    const key = existing.label.toLowerCase();
    const askedAgain = askedByLabel.get(key);
    if (askedAgain) matched.add(key);
    if (existing.status === "reviewed" && askedAgain) {
      items.push({
        change: "reopened",
        // The source quote moves to the reply's wording, because that is the request now open.
        requirement: { ...existing, status: "needed", sourceQuote: askedAgain.sourceQuote },
        replyQuote: askedAgain.sourceQuote,
      });
    } else if (existing.status === "reviewed") {
      items.push({ change: "carried", requirement: { ...existing } });
    } else {
      items.push({
        change: "outstanding",
        requirement: askedAgain
          ? { ...existing, sourceQuote: askedAgain.sourceQuote }
          : { ...existing },
        replyQuote: askedAgain?.sourceQuote,
      });
    }
  }

  for (const a of asked) {
    if (matched.has(a.label.toLowerCase())) continue;
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
      ? `Started a new revision from the reply. Asked for again: ${counts.reopened}. New in this reply: ${counts.added}. Still on your list: ${counts.outstanding}. Kept as reviewed: ${counts.carried}. Review the current response form.`
      : "Started a new revision from the reply. Review the current response form and evidence requirements.",
  );
}
