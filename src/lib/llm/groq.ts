import { reserveSpend } from "@/lib/breaker";
import { hasUnlimitedDevUsage } from "@/lib/devUsage";
import type { GeminiCallInput, GeminiCallResult } from "./gemini";

export function isGroqConfigured(): boolean {
  return process.env.NODE_ENV !== "production" && Boolean(process.env.GROQ_API_KEY?.trim());
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

  const model = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
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
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    input.task === "classify-notice" ? 9_000 : 25_000,
  );
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
        reasoning_effort: "low",
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
