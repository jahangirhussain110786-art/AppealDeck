import { reserveSpend } from "@/lib/breaker";
import { hasUnlimitedDevUsage } from "@/lib/devUsage";
import type { GeminiCallInput, GeminiCallResult } from "./gemini";

/** A request is not started with less time than this left in the caller's budget. */
const MIN_REQUEST_MS = 1_000;

/**
 * Groq is a second processor of the seller's text. Locally it is on whenever a key is present; in
 * production it also needs `GROQ_PRODUCTION_CONFIRMED=true`, set only after the privacy policy
 * names it (DEPLOYMENT §6c). Forgetting the switch leaves Gemini alone, never a quiet new processor.
 */
export function isGroqConfigured(): boolean {
  const allowed =
    process.env.NODE_ENV !== "production" || process.env.GROQ_PRODUCTION_CONFIRMED === "true";
  return allowed && Boolean(process.env.GROQ_API_KEY?.trim());
}

/** Models tried in turn: Groq limits each model separately, so a second model is a second quota. */
function groqModels(): string[] {
  const primary = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
  const second = process.env.GROQ_FALLBACK_MODEL?.trim() || "llama-3.3-70b-versatile";
  return second === primary ? [primary] : [primary, second];
}

export function canUseGroq(input: GeminiCallInput): boolean {
  return (
    isGroqConfigured() &&
    input.task !== "read-document" &&
    !input.messages.some((message) => message.documents?.length)
  );
}

export async function callGroq(input: GeminiCallInput): Promise<GeminiCallResult> {
  if (!canUseGroq(input)) {
    return { ok: false, reason: "not_configured", message: "Groq text fallback is unavailable." };
  }
  // The caller's deadline covers the fallback too: an answer that arrives after it is no answer,
  // and a reserved request would be spent on it (26 Oct 2026).
  if (input.deadline !== undefined && input.deadline - Date.now() < MIN_REQUEST_MS) {
    return {
      ok: false,
      reason: "timeout",
      message: "No time remained in the caller's budget for the text fallback.",
    };
  }
  if (
    !hasUnlimitedDevUsage() &&
    !(
      await reserveSpend({
        name: "groq",
        spendCapPerDay: 900,
        perMinuteLimit: 0,
        errorRateThreshold: 0.5,
        minVolumePerWindow: 10,
        windowMs: 60_000,
        cooldownMs: 30_000,
        scope: "user",
        spendCountedAt: "call",
      })
    ).ok
  ) {
    return { ok: false, reason: "spend_cap", message: "Groq's app allowance is used up today." };
  }

  const messages = input.messages.map((message) => ({
    role: message.role === "model" ? "assistant" : message.role,
    content: message.text,
  }));
  if (input.responseJsonSchema) {
    messages.unshift({
      role: "system",
      content: `Return only a JSON object matching this schema: ${JSON.stringify(input.responseJsonSchema)}`,
    });
  }
  let last: GeminiCallResult = {
    ok: false,
    reason: "upstream_error",
    message: "Groq could not complete the request.",
  };
  for (const model of groqModels()) {
    // Between models, spend only what the caller's budget has left; the second model must not get
    // a fresh full timeout after the first has used the time.
    if (input.deadline !== undefined && input.deadline - Date.now() < MIN_REQUEST_MS) {
      return {
        ok: false,
        reason: "timeout",
        message: "The caller's budget ran out before the text fallback could finish.",
      };
    }
    last = await callGroqModel(input, messages, model);
    // Another model only for a limit or an outage; an answer, or a request it cannot take, ends it.
    if (last.ok || (last.reason !== "busy" && last.reason !== "upstream_error")) return last;
  }
  return last;
}

async function callGroqModel(
  input: GeminiCallInput,
  messages: { role: string; content: string }[],
  model: string,
): Promise<GeminiCallResult> {
  const controller = new AbortController();
  const baseTimeoutMs = input.task === "classify-notice" ? 9_000 : 25_000;
  const timeoutMs =
    input.deadline === undefined
      ? baseTimeoutMs
      : Math.min(baseTimeoutMs, Math.max(1, input.deadline - Date.now()));
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: input.temperature ?? 0.2,
        max_completion_tokens: (input.maxOutputTokens ?? 512) + 1024,
        ...(model.includes("gpt-oss") ? { reasoning_effort: "low" } : {}),
        ...(input.responseJsonSchema || input.responseJson
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        ok: false,
        reason: response.status === 429 ? "busy" : "upstream_error",
        message: `Groq returned HTTP ${response.status}.`,
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
        message: "Groq returned no complete answer.",
      };
    }
    return {
      ok: true,
      // This model sometimes writes non-breaking hyphens and spaces, which paste into Amazon's form
      // as odd glyphs and defeat a plain-text search for the seller's own words.
      text: text.replace(/‑/g, "-").replace(/[  ]/g, " ").trim(),
      model: `groq:${model}`,
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
      message: "Groq could not complete the request.",
    };
  } finally {
    clearTimeout(timer);
  }
}
