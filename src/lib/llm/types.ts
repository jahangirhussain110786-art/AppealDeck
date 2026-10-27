/**
 * What every AI provider adapter speaks (27 Oct 2026). The app asks for "an AI answer" in these
 * terms; which company's model gives it is decided in `ai.ts` from the environment, and each adapter
 * turns these types into its own provider's request. Nothing outside `src/lib/llm/providers` and
 * the adapter files names a provider.
 */

/** Call-site task tags; each adapter maps a tag to the model it uses for that workload. */
export type LlmTask = "improve-wording" | "read-document" | "draft-poa" | "classify-notice";

export type LlmRole = "system" | "user" | "model";

/**
 * AA-41: a document the model should read, sent inline rather than uploaded to a file store.
 *
 * Inline means the bytes exist only for the duration of one request — we never hold a copy, which
 * is the smallest footprint that still lets the model see an invoice. Size is capped by the caller
 * (`/api/read-document`), because base64 inflates by a third and a large scan would otherwise be
 * rejected by the upstream with an unhelpful error.
 */
export type LlmInlineDocument = {
  /** Base64 without the `data:` prefix. */
  data: string;
  /** e.g. "application/pdf", "image/jpeg", "image/png". */
  mimeType: string;
};

export type LlmMessage = {
  role: LlmRole;
  text: string;
  /** Attached to this message as additional parts. Only meaningful on a `user` message. */
  documents?: LlmInlineDocument[];
};

export type LlmCallInput = {
  messages: LlmMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
  task?: LlmTask;
  responseJsonSchema?: Record<string, unknown>;
  responseJson?: boolean;
  /**
   * Reasoning tokens the model may spend before answering. JSON-mode calls default to 0 (the
   * schema-mode stall of 25 Sep 2026 was with thinking on); a caller that wants reasoning says so.
   * Providers without such a setting ignore it.
   */
  thinkingBudget?: number;
  /**
   * When the caller's own budget runs out, as epoch milliseconds (26 Oct 2026). A caller that makes
   * more than one model call in one request — the drafters retry once — sets it once and passes it
   * to every call, so the retry shares one budget instead of starting a fresh one that can outlast
   * the route. Every attempt, retry, alternate model and other provider stays inside it.
   */
  deadline?: number;
};

export type LlmFailureReason =
  | "not_configured"
  | "spend_cap"
  | "upstream_error"
  | "bad_input"
  | "busy"
  | "timeout"
  | "invalid_response";

export type LlmCallResult =
  | { ok: true; text: string; model: string; usage?: { inputTokens: number; outputTokens: number } }
  | { ok: false; reason: LlmFailureReason; message: string };

/** The providers the code knows how to call. Which of them may run is decided by `ai.ts`. */
export type ProviderId = "gemini" | "anthropic" | "openai" | "groq";

/** Given to the first provider so it can hand a failing first attempt to the next one at once. */
export type ProviderContext = {
  tryFallback: () => Promise<LlmCallResult | undefined>;
};

export interface LlmProvider {
  id: ProviderId;
  /** A key is present and, in production, its data-terms switch is on. */
  isConfigured(): boolean;
  /** Whether this provider can take this request (Groq cannot read documents, for one). */
  supports(input: LlmCallInput): boolean;
  call(input: LlmCallInput, context: ProviderContext): Promise<LlmCallResult>;
}

/**
 * A request refused because of the key or project, not because of what was asked: an invalid key
 * (HTTP 400 "API key not valid" from Google, 401 from the others), a revoked or restricted one (403)
 * and a missing model (404). None of these is the seller's fault, so another provider may answer; a
 * genuinely malformed request (any other 400) still may not. Every adapter words its bad-input
 * message as "<Provider> returned <status>: …" so this one test serves all of them.
 */
export function isConfigurationError(result: LlmCallResult): boolean {
  return (
    !result.ok &&
    result.reason === "bad_input" &&
    (/^[A-Za-z]+ returned (401|403|404):/.test(result.message) ||
      /API_KEY_INVALID|API key not valid|API key expired|invalid x-api-key|Incorrect API key/i.test(
        result.message,
      ))
  );
}

/** Output tokens asked for when a caller does not say. */
export const DEFAULT_MAX_OUTPUT_TOKENS = 512;
/** A request is not started with less time than this left in the caller's budget. */
export const MIN_REQUEST_MS = 1_000;
