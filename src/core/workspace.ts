import type { CaseFile } from "./interviewEngine";
import type { PoaDraft } from "./composer";

export const PROTOCOL_LABELS = {
  documents: "Document response",
  operational: "Operational Plan of Action",
  dispute: "Disputed allegation",
  information: "Informational update",
  clarification: "Clarification needed",
  specialist: "Professional review",
} as const;
export type Protocol = keyof typeof PROTOCOL_LABELS;
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
  if (
    /\b(forged|falsified|fabricated|manipulated|altered|inauthentic)\s+(documents?|invoices?)|\b(fraud|child safety|product safety|recall|related account|linked to another account|intellectual property|trademark infringement|copyright infringement)\b/i.test(
      text,
    )
  )
    return {
      protocol: "specialist",
      reason: "The notice includes a sensitive allegation that needs professional review.",
    };
  if (w.marketplace !== "US")
    return {
      protocol: "clarification",
      reason: "This workspace currently supports English-language Amazon US requests.",
    };
  if (
    /\b(identity verification|video (?:call|interview)|government.issued (?:ID|identification)|funds? (?:disbursement|withheld))\b/i.test(
      text,
    )
  )
    return {
      protocol: "clarification",
      reason:
        "This request needs a verification or specialist process outside the supported response routes. Follow the current instructions in Seller Central.",
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
  const clauses = text
    .split(/\n|(?<=[.!?])\s+/)
    .filter((s) => !/\b(do not|don't|not required|no need to)\b/i.test(s));
  const requested = clauses.join("\n");
  const operational =
    /\b(provide|submit|send|explain|describe)\b[^\n.!?]{0,180}\b(plan of action|root cause|corrective actions)\b/i.test(
      requested,
    ) ||
    w.formInstructions
      .split(/\n|(?<=[.!?])\s+/)
      .some(
        (s) =>
          !/\b(do not|don't|not required|previous|earlier)\b/i.test(s) &&
          /\b(plan of action|root cause|corrective actions)\b/i.test(s),
      );
  const documents =
    /\b(provide|submit|upload|send|include|request(?:ed|ing)?)\b[^\n.!?]{0,180}\b(invoice|document|record|proof|certificate|sales report|order report|metrics? report|letter of authorization|authori[sz]ation letter|listing screenshot)s?\b/i.test(
      requested,
    );
  const informational =
    /\b(no (?:further|additional) (?:information|action|documents?).{0,30}(?:required|requested|needed)|(?:still|remains?|currently) under review)\b/i.test(
      text,
    );
  if (informational && !documents && !operational)
    return {
      protocol: "information",
      reason:
        "The update indicates review is ongoing or requests no further action. Confirm this against the case page.",
    };
  if (operational)
    return {
      protocol: "operational",
      reason:
        "The supplied instructions explicitly mention a Plan of Action or its operational sections.",
    };
  if (documents)
    return {
      protocol: "documents",
      reason: "The supplied instructions explicitly request supporting records.",
    };
  return {
    protocol: "clarification",
    reason:
      "The requested response is unclear. Check the exact form or contact Account Health support before preparing a response.",
  };
}

export function workspaceGaps(w: Workspace): string[] {
  const gaps: string[] = [];
  const route = routeWorkspace(w);
  if (!w.confirmed || route.protocol !== w.protocol)
    gaps.push("Confirm the requested route against the notice and form.");
  if (!["documents", "operational"].includes(route.protocol)) gaps.push(route.reason);
  if (!w.requirementsConfirmed)
    gaps.push("Confirm that the list covers every item requested by the notice and form.");
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
    ["documents", "operational"].includes(routeWorkspace(w).protocol) &&
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
  const sections =
    w.protocol === "operational"
      ? [
          { heading: "Root Cause", body: w.explanation },
          { heading: "Corrective Actions", body: w.correctiveActions },
          { heading: "Preventive Measures", body: w.preventiveMeasures },
        ]
      : [{ heading: "Response to the document request", body: w.explanation }];
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
