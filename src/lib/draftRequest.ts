import type { Workspace } from "@/core/workspace";
import { answerFor, questionnaireQuestions, writtenPartGaps } from "@/core/workspace";
import { detectIssues } from "@/core/noticeIssues";
import { replyCriticisms } from "@/core/replyFeedback";
import type { ViolationKind } from "@/core/violationKinds";
import type { DraftRequest } from "@/lib/llm/draftResponse";
import type { OtherDraftRequest } from "@/lib/llm/draftOther";

/**
 * What the AI is allowed to see, taken from a case. Returns null when the case is not one the AI
 * writes for: only a Plan of Action (the operational protocol), and only once the seller has
 * written all three answers. A document request or a questionnaire is answered in the seller's own
 * words, question by question, and rewording an answer to one of Amazon's questions is the
 * seller's call (the opt-in wording help), not something done to every response.
 *
 * Files are never sent. The AI sees a record's label, its file name and the seller's note about
 * what it shows: the same words that appear in the response's own "Supporting records" section,
 * which is assembled by code and is never AI text.
 *
 * 9 Oct 2026: it also sees the response page's instructions, every issue the notice raised, and
 * every record Amazon asked for with its state, so the draft can say truthfully what is attached
 * and what is not, and answer every issue rather than the first.
 */
export function draftRequestFrom(
  w: Workspace,
  kind: ViolationKind,
  attempt: number,
): DraftRequest | null {
  if (w.protocol !== "operational") return null;
  if (writtenPartGaps(w).length > 0) return null;

  const requests = [...w.previousRequests.map((p) => p.notice), w.notice].filter((t) => t.trim());
  const latestReply = w.replies.at(-1)?.text ?? (w.revision > 1 ? w.notice : "");
  const reasons = latestReply ? replyCriticisms(latestReply, 6) : [];

  return {
    kind,
    notice: requests.join("\n\n--- later request ---\n\n"),
    formInstructions: w.formInstructions.trim() || undefined,
    attempt,
    answers: {
      rootCause: w.explanation.trim(),
      correctiveActions: w.correctiveActions.trim(),
      preventiveMeasures: w.preventiveMeasures.trim(),
    },
    records: w.requirements
      .filter((r) => r.status === "reviewed" && r.recordId && r.filename)
      .map((r) => ({ label: r.label, filename: r.filename, note: r.note.trim() || undefined })),
    declined: w.requirements
      .filter((r) => r.status === "cannot_obtain" && r.declined?.reason.trim())
      .map((r) => ({ label: r.label, reason: r.declined!.reason.trim() })),
    requested: w.requirements.map((r) => ({ label: r.label, status: r.status })),
    issues: detectIssues(w.notice, w.formInstructions).map((i) => ({
      kind: i.kind,
      quote: i.sourceQuote,
    })),
    replyReasons: reasons,
  };
}

/**
 * The same, for the two other written responses (9 Oct 2026): a document request's explanation
 * and a questionnaire's answers. Null for any other protocol, and while the seller has not written
 * what the response needs.
 */
export function otherDraftRequestFrom(
  w: Workspace,
  kind: ViolationKind,
  attempt: number,
): OtherDraftRequest | null {
  if (w.protocol !== "documents" && w.protocol !== "questionnaire") return null;
  if (writtenPartGaps(w).length > 0) return null;

  const requests = [...w.previousRequests.map((p) => p.notice), w.notice].filter((t) => t.trim());
  const latestReply = w.replies.at(-1)?.text ?? (w.revision > 1 ? w.notice : "");
  const reasons = latestReply ? replyCriticisms(latestReply, 6) : [];
  const questions =
    w.protocol === "questionnaire"
      ? questionnaireQuestions(w).map((q) => ({ question: q, answer: answerFor(w, q).trim() }))
      : [];

  return {
    protocol: w.protocol,
    kind,
    notice: requests.join("\n\n--- later request ---\n\n"),
    formInstructions: w.formInstructions.trim() || undefined,
    attempt,
    explanation: w.explanation.trim(),
    questions,
    records: w.requirements
      .filter((r) => r.status === "reviewed" && r.recordId && r.filename)
      .map((r) => ({ label: r.label, filename: r.filename, note: r.note.trim() || undefined })),
    declined: w.requirements
      .filter((r) => r.status === "cannot_obtain" && r.declined?.reason.trim())
      .map((r) => ({ label: r.label, reason: r.declined!.reason.trim() })),
    requested: w.requirements.map((r) => ({ label: r.label, status: r.status })),
    issues: detectIssues(w.notice, w.formInstructions).map((i) => ({
      kind: i.kind,
      quote: i.sourceQuote,
    })),
    replyReasons: reasons,
    dispute: w.position === "dispute",
  };
}
