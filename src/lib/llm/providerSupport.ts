import type { LlmCallInput, LlmTask } from "./types";

/**
 * What the Claude and OpenAI adapters share (27 Oct 2026). Gemini and Groq keep their own copies of
 * the numbers below, because they were tuned and measured separately and their tests pin them.
 */

/** Per-attempt limits by task: a scanned multi-page invoice takes longer than a one-line reading. */
const TASK_TIMEOUT_MS: Record<LlmTask, number> = {
  "read-document": 25_000,
  "improve-wording": 12_000,
  "draft-poa": 25_000,
  "classify-notice": 9_000,
};
const TASK_BUDGET_MS: Record<LlmTask, number> = {
  "read-document": 55_000,
  "improve-wording": 40_000,
  "draft-poa": 55_000,
  "classify-notice": 14_000,
};
const DEFAULT_TIMEOUT_MS = 8_000;

export function taskTimeoutMs(task?: LlmTask): number {
  return task ? TASK_TIMEOUT_MS[task] : DEFAULT_TIMEOUT_MS;
}

/** When this call's own budget runs out, unless the caller set one deadline for several calls. */
export function deadlineFor(input: LlmCallInput): number {
  return (
    input.deadline ?? Date.now() + (input.task ? TASK_BUDGET_MS[input.task] : DEFAULT_TIMEOUT_MS)
  );
}

/**
 * A provider whose data terms a person must have read before it receives a seller's text runs in
 * production only when its `<NAME>_PRODUCTION_CONFIRMED` switch is on. Locally a key is enough.
 * (Gemini keeps its older `GEMINI_PAID_TIER_CONFIRMED`; Groq's is `GROQ_PRODUCTION_CONFIRMED`.)
 */
export function productionConfirmed(envName: string): boolean {
  return process.env.NODE_ENV !== "production" || process.env[envName] === "true";
}

/** `<PREFIX>_MODEL_<TASK>`, else `<PREFIX>_MODEL`, else the default (which may be none). */
export function modelFor(
  prefix: string,
  task: LlmTask | undefined,
  fallback?: string,
): string | undefined {
  if (task) {
    const key = `${prefix}_MODEL_${task.toUpperCase().replace(/-/g, "_")}`;
    const taskModel = process.env[key]?.trim();
    if (taskModel) return taskModel;
  }
  return process.env[`${prefix}_MODEL`]?.trim() || fallback;
}

/** The second model asked when the first is busy or over its quota; `none` switches it off. */
export function fallbackModelFor(prefix: string, defaultModel?: string): string | undefined {
  const raw = process.env[`${prefix}_FALLBACK_MODEL`]?.trim();
  if (raw === "none") return undefined;
  return raw || defaultModel;
}

/**
 * The instruction that stands in for a provider-side schema: the callers validate every JSON answer
 * (Zod) and refuse anything malformed, so the schema is a second layer, not the only one.
 */
export function jsonInstruction(input: LlmCallInput): string | undefined {
  if (input.responseJsonSchema) {
    return `Reply with a single JSON object that matches this JSON Schema exactly, and nothing else:\n${JSON.stringify(input.responseJsonSchema)}`;
  }
  if (input.responseJson) return "Reply with a single JSON object and nothing else.";
  return undefined;
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
