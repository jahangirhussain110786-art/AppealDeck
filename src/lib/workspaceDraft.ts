import { questionnaireQuestions, type Workspace } from "@/core/workspace";

/**
 * Keys for unsaved workspace field text, autosaved into `Workspace.draft` (encrypted,
 * vault-backed) so edits survive tab/route changes, reloads and the sign-in redirect,
 * rather than living only in transient React state.
 */
export const REQUEST_DRAFT_KEYS = ["request.notice", "request.formInstructions"];
export const RESPONSE_DRAFT_KEYS = [
  "response.explanation",
  "response.correctiveActions",
  "response.preventiveMeasures",
];

export function answerDraftKey(question: string): string {
  return `response.answer.question:${question}`;
}

export function responseDraftKeys(questions: string[]): string[] {
  return [...RESPONSE_DRAFT_KEYS, ...questions.map(answerDraftKey)];
}

export function migrateAnswerDrafts(w: Workspace): Record<string, string> | undefined {
  if (!w.draft) return undefined;
  const draft = { ...w.draft };
  questionnaireQuestions(w).forEach((question, index) => {
    const legacyKey = `response.answer.${index}`;
    if (draft[legacyKey] !== undefined) {
      draft[answerDraftKey(question)] ??= draft[legacyKey];
      delete draft[legacyKey];
    }
  });
  return draft;
}
export const HISTORY_REPLY_KEY = "history.replyText";
export function evidenceNoteKey(requirementId: string): string {
  return `evidence.${requirementId}.note`;
}

export function withDraftValue(
  draft: Record<string, string> | undefined,
  key: string,
  value: string | undefined,
): Record<string, string> | undefined {
  const next = { ...(draft ?? {}) };
  if (value === undefined) delete next[key];
  else next[key] = value;
  return Object.keys(next).length ? next : undefined;
}

export function withoutDraftKeys(
  draft: Record<string, string> | undefined,
  keys: string[],
): Record<string, string> | undefined {
  if (!draft) return draft;
  const next = { ...draft };
  for (const key of keys) delete next[key];
  return Object.keys(next).length ? next : undefined;
}
