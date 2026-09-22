import type { CaseFile } from "./interviewEngine";
import type { PoaDraft } from "./composer";
import { determineResponseType } from "./responseType";
import type { ResponseType } from "./responseType";
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
  status: "needed" | "waiting" | "reviewed";
  note: string;
  recordId?: string;
  filename?: string;
  contentHash?: string;
  page?: number;
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
  const candidates: Array<[RegExp, string]> = [
    [/\binvoices?\b/i, "Supplier invoice"],
    [/\b(letter of authorization|authori[sz]ation letter|LOA)\b/i, "Authorization letter"],
    [
      /\b(identity document|government.issued (?:ID|identification))\b/i,
      "Requested identity record",
    ],
    [
      /\b(sales report|sales records?|order report|metrics? report)\b/i,
      "Sales or performance record",
    ],
    [/\b(proof of (?:correction|changes)|listing screenshots?)\b/i, "Listing correction record"],
  ];
  return candidates.flatMap(([pattern, label]) => {
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
    if (
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

/** Confirmed reply revisions preserve every earlier submission and file reference. */
export function applyWorkspaceReply(w: Workspace, replyId: string): Workspace {
  const reply = w.replies.find((r) => r.id === replyId);
  if (!reply || reply.applied) return w;
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
    requirements: w.requirements.map((r) => ({ ...r, status: "needed" as const })),
    replies: w.replies.map((r) => (r.id === replyId ? { ...r, applied: true } : r)),
  };
  return addWorkspaceEvent(
    updated,
    "Started a new revision from the reply. Review the current response form and evidence requirements.",
  );
}
