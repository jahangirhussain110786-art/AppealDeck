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
/** A questionnaire answer's unsaved text, keyed by the question's position on the page. */
export function answerDraftKey(index: number): string {
  return `response.answer.${index}`;
}

/** Every response draft key for a case whose questionnaire has `questionCount` questions. */
export function responseDraftKeys(questionCount: number): string[] {
  return [
    ...RESPONSE_DRAFT_KEYS,
    ...Array.from({ length: questionCount }, (_, i) => answerDraftKey(i)),
  ];
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
  if (value === undefined || value === "") delete next[key];
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
