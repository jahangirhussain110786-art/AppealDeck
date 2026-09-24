import {
  withBreaker,
  reserveSpend,
  type BreakerOptions,
  type BreakerContext,
  type DegradedResponse,
} from "@/lib/breaker";
import type { NextRequest } from "next/server";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-3.5-flash";
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_OUTPUT_TOKENS = 512;

/**
 * Call-site task tags. Each tag maps to a free-tier model tuned for that
 * workload. Callers pass `task` instead of a raw model id; the resolver
 * picks the right one. Per-task env overrides let ops swap a model without
 * code changes. The default model covers anything not in the table.
 */
// Only the tasks the app actually calls. Three more ("critique-poa", "phrase-engine-output",
// "triage-router") sat here, never called, and the deployment guide told people to set model
// overrides for them that did nothing; removed 24 Sep 2026.
export type LlmTask = "improve-wording" | "read-document";

const TASK_MODELS: Record<LlmTask, string> = {
  // AA-41: reading a scanned invoice is the hardest perception task in the product — a lite model
  // that mis-reads a date or a supplier name produces a confidently wrong finding, which is worse
  // than no finding at all. Deliberately the strongest flash tier.
  "read-document": "gemini-3.5-flash",
  // Rewording one section of a seller's own response (24 Sep 2026). Replaces "draft-poa-section",
  // which drafted whole sections and had not been able to run for any case since 22 Sep. A small
  // text task, but a mistake here is a sentence in an appeal, so not a lite model either.
  "improve-wording": "gemini-3.5-flash",
};

function envForTask(task: LlmTask): string | undefined {
  const key = `GEMINI_MODEL_${task.toUpperCase().replace(/-/g, "_")}`;
  const raw = process.env[key];
  return raw && raw.trim().length > 0 ? raw.trim() : undefined;
}

export function getGeminiModel(task?: LlmTask): string {
  if (task) {
    const override = envForTask(task);
    if (override) return override;
    return TASK_MODELS[task];
  }
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

export type GeminiRole = "system" | "user" | "model";

/**
 * AA-41: a document the model should read, sent inline rather than uploaded to a file store.
 *
 * Inline means the bytes exist only for the duration of one request — we never hold a copy, which
 * is the smallest footprint that still lets the model see an invoice. Size is capped by the caller
 * (`/api/read-document`), because base64 inflates by a third and a large scan would otherwise be
 * rejected by the upstream with an unhelpful error.
 */
export type GeminiInlineDocument = {
  /** Base64 without the `data:` prefix. */
  data: string;
  /** e.g. "application/pdf", "image/jpeg", "image/png". */
  mimeType: string;
};

export type GeminiMessage = {
  role: GeminiRole;
  text: string;
  /** Attached to this message as additional parts. Only meaningful on a `user` message. */
  documents?: GeminiInlineDocument[];
};

export type GeminiCallInput = {
  messages: GeminiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
  task?: LlmTask;
  responseJsonSchema?: Record<string, unknown>;
  responseJson?: boolean;
};

export type GeminiCallResult =
  | { ok: true; text: string; model: string; usage?: { inputTokens: number; outputTokens: number } }
  | {
      ok: false;
      reason: "not_configured" | "spend_cap" | "upstream_error" | "timeout" | "invalid_response";
      message: string;
    };

export const breakerOptions: BreakerOptions = {
  name: "gemini",
  spendCapPerDay: 240,
  perMinuteLimit: 9,
  errorRateThreshold: 0.5,
  minVolumePerWindow: 10,
  windowMs: 60_000,
  cooldownMs: 30_000,
  scope: "user",
  // Counted in `callGemini`, only for a request that has passed sign-in and the Pass check and is
  // about to reach Google. See `reserveSpend`.
  spendCountedAt: "call",
};

/**
 * B-15, as changed on 24 Sep 2026. D9 exists because Google may use prompts sent on the free tier
 * to improve its products, and the privacy policy tells sellers their documents and wording are
 * sent to the paid tier, which does not. A key does not say which tier its project is billed on,
 * so no code can detect a free-tier key. What code can do is refuse to send anything in production
 * until someone has confirmed, in writing, that billing is on: `GEMINI_PAID_TIER_CONFIRMED=true`,
 * set after DEPLOYMENT §6b. Forgetting it switches the AI features off rather than quietly breaking
 * the privacy promise.
 */
export function isPaidTierConfirmed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.GEMINI_PAID_TIER_CONFIRMED === "true";
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) && isPaidTierConfirmed();
}

function getApiKey(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return k;
}

export async function callGemini(input: GeminiCallInput): Promise<GeminiCallResult> {
  if (!isGeminiConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message: isPaidTierConfirmed()
        ? "Gemini is not configured. Set GEMINI_API_KEY in the environment to enable cloud calls."
        : "Gemini is switched off in production until GEMINI_PAID_TIER_CONFIRMED=true is set (DEPLOYMENT §6b).",
    };
  }

  const budget = await reserveSpend(breakerOptions);
  if (!budget.ok) {
    return {
      ok: false,
      reason: "spend_cap",
      message: "Today's allowance for AI reading is used up. It resets at midnight UTC.",
    };
  }

  const apiKey = getApiKey();
  const model = input.model ?? getGeminiModel(input.task);
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const system = input.messages.find((m) => m.role === "system");
  const contents = input.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "model" ? "model" : "user",
      // AA-41: the text part stays first so the instruction is read before the document, which is
      // what the model's own prompting guidance recommends for document questions.
      parts: [
        { text: m.text },
        ...(m.documents ?? []).map((d) => ({
          inlineData: { mimeType: d.mimeType, data: d.data },
        })),
      ],
    }));

  const generationConfig: Record<string, unknown> = {
    temperature: input.temperature ?? 0.2,
    maxOutputTokens: input.maxOutputTokens ?? MAX_OUTPUT_TOKENS,
  };
  if (input.responseJsonSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = input.responseJsonSchema;
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  } else if (input.responseJson) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  } else {
    generationConfig.responseMimeType = "text/plain";
  }

  const body = {
    contents,
    systemInstruction: system ? { role: "system", parts: [{ text: system.text }] } : undefined,
    generationConfig,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        reason: "upstream_error",
        message: `Gemini returned ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const data: unknown = await res.json();
    const parsed = parseGeminiResponse(data);
    if (!parsed) {
      return {
        ok: false,
        reason: "invalid_response",
        message: "Gemini response did not match expected shape.",
      };
    }
    return { ok: true, text: parsed.text, model, usage: parsed.usage };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        reason: "timeout",
        message: `Gemini timed out after ${REQUEST_TIMEOUT_MS}ms.`,
      };
    }
    return {
      ok: false,
      reason: "upstream_error",
      message: err instanceof Error ? err.message : "Unknown network error.",
    };
  } finally {
    clearTimeout(timer);
  }
}

type Parsed = { text: string; usage?: { inputTokens: number; outputTokens: number } };

function parseGeminiResponse(data: unknown): Parsed | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const candidates = d.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const first = candidates[0] as Record<string, unknown>;
  const content = first.content as Record<string, unknown> | undefined;
  const parts = content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts
    .map((p) => (p && typeof p === "object" ? (p as Record<string, unknown>).text : null))
    .filter((t): t is string => typeof t === "string")
    .join("")
    .trim();
  if (!text) return null;

  const usageMeta = d.usageMetadata as Record<string, unknown> | undefined;
  const usage = usageMeta
    ? {
        inputTokens: Number(usageMeta.promptTokenCount ?? 0),
        outputTokens: Number(usageMeta.candidatesTokenCount ?? 0),
      }
    : undefined;
  return { text, usage };
}

export type GeminiRouteHandler = (req: NextRequest, ctx: BreakerContext) => Promise<Response>;

export function withGeminiBreaker(handler: GeminiRouteHandler): GeminiRouteHandler {
  return withBreaker(breakerOptions, handler);
}

export function degradedGeminiResponse(d: DegradedResponse): Response {
  return new Response(JSON.stringify(d), {
    status: d.reason === "circuit_open" ? 503 : 429,
    headers: { "Content-Type": "application/json" },
  });
}

export const __test = { parseGeminiResponse, breakerOptions, TASK_MODELS, envForTask };
