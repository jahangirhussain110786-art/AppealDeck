import { reserveSpend } from "@/lib/breaker";
import { hasUnlimitedDevUsage } from "@/lib/devUsage";
import { chatCompletion, type ChatMessage } from "./openaiCompat";
import { MIN_REQUEST_MS, type LlmCallInput, type LlmCallResult, type LlmProvider } from "./types";

/**
 * Groq is a second processor of the seller's text. Locally it is on whenever a key is present; in
 * production it also needs `GROQ_PRODUCTION_CONFIRMED=true`, set only after the privacy policy
 * names it (DEPLOYMENT §6c). Forgetting the switch leaves the other providers alone, never a quiet
 * new processor.
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

export function canUseGroq(input: LlmCallInput): boolean {
  return (
    isGroqConfigured() &&
    input.task !== "read-document" &&
    !input.messages.some((message) => message.documents?.length)
  );
}

export async function callGroq(input: LlmCallInput): Promise<LlmCallResult> {
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

  const messages: ChatMessage[] = input.messages.map((message) => ({
    role: message.role === "model" ? "assistant" : message.role,
    content: message.text,
  }));
  if (input.responseJsonSchema) {
    messages.unshift({
      role: "system",
      content: `Return only a JSON object matching this schema: ${JSON.stringify(input.responseJsonSchema)}`,
    });
  }
  let last: LlmCallResult = {
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
    last = await chatCompletion({
      label: "Groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY as string,
      model,
      modelTag: `groq:${model}`,
      messages,
      input,
      baseTimeoutMs: input.task === "classify-notice" ? 9_000 : 25_000,
      extraBody: model.includes("gpt-oss") ? { reasoning_effort: "low" } : undefined,
    });
    // Another model only for a limit or an outage; an answer, or a request it cannot take, ends it.
    if (last.ok || (last.reason !== "busy" && last.reason !== "upstream_error")) return last;
  }
  return last;
}

/** Text only: it never receives a document, and it is only ever asked after another provider. */
export const groqProvider: LlmProvider = {
  id: "groq",
  isConfigured: isGroqConfigured,
  supports: canUseGroq,
  call: (input) => callGroq(input),
};
