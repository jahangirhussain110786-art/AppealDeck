import type { LlmCallInput, LlmCallResult } from "./types";

/**
 * One request to an OpenAI-style chat-completions endpoint (27 Oct 2026). Groq and OpenAI both speak
 * it, so the request, the timeout, the way a failure is classified and the reading of the answer are
 * written once. The two adapters differ only in the address, the key, the models, whether a document
 * may be sent, and the extras they add to the body.
 */
export type ChatMessage = { role: string; content: string | ChatPart[] };
export type ChatPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

export async function chatCompletion(options: {
  /** How the provider is named in our own messages, e.g. "Groq". */
  label: string;
  url: string;
  apiKey: string;
  model: string;
  /** What the result reports as the model, e.g. `groq:<model>`. */
  modelTag: string;
  messages: ChatMessage[];
  input: LlmCallInput;
  baseTimeoutMs: number;
  /** Added to the request body: model-specific settings such as a reasoning level. */
  extraBody?: Record<string, unknown>;
  /**
   * When true, a 4xx other than "slow down" or "timed out" is reported as `bad_input` with the
   * status in the message, so a bad key or a missing model can be told from a provider outage.
   */
  classifyClientErrors?: boolean;
}): Promise<LlmCallResult> {
  const { label, input } = options;
  const controller = new AbortController();
  const timeoutMs =
    input.deadline === undefined
      ? options.baseTimeoutMs
      : Math.min(options.baseTimeoutMs, Math.max(1, input.deadline - Date.now()));
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(options.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: input.temperature ?? 0.2,
        max_completion_tokens: (input.maxOutputTokens ?? 512) + 1024,
        ...options.extraBody,
        ...(input.responseJsonSchema || input.responseJson
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      if (
        options.classifyClientErrors &&
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 429 &&
        response.status !== 408
      ) {
        const text = await response.text().catch(() => "");
        return {
          ok: false,
          reason: "bad_input",
          message: `${label} returned ${response.status}: ${text.slice(0, 200)}`,
        };
      }
      return {
        ok: false,
        reason: response.status === 429 ? "busy" : "upstream_error",
        message: `${label} returned HTTP ${response.status}.`,
      };
    }
    const data = (await response.json()) as {
      choices?: { finish_reason?: string; message?: { content?: unknown } }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const choice = data.choices?.[0];
    const text = choice?.message?.content;
    if (typeof text !== "string" || !text.trim() || choice?.finish_reason === "length") {
      return {
        ok: false,
        reason: "invalid_response",
        message: `${label} returned no complete answer.`,
      };
    }
    return {
      ok: true,
      // Some models write non-breaking hyphens and spaces, which paste into Amazon's form as odd
      // glyphs and defeat a plain-text search for the seller's own words.
      text: text
        .replace(/\u2011/g, "-")
        .replace(/[\u00a0\u202f]/g, " ")
        .trim(),
      model: options.modelTag,
      ...(data.usage
        ? {
            usage: {
              inputTokens: data.usage.prompt_tokens,
              outputTokens: data.usage.completion_tokens,
            },
          }
        : {}),
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error && error.name === "AbortError" ? "timeout" : "upstream_error",
      message: `${label} could not complete the request.`,
    };
  } finally {
    clearTimeout(timer);
  }
}
