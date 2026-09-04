import {
  withBreaker,
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
export type LlmTask = "extract-field" | "critique-poa" | "phrase-engine-output" | "triage-router";

const TASK_MODELS: Record<LlmTask, string> = {
  "extract-field": "gemini-3.5-flash",
  "critique-poa": "gemini-3.5-flash",
  "phrase-engine-output": "gemini-3.5-flash-lite",
  "triage-router": "gemini-flash-lite-latest",
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

export type GeminiMessage = {
  role: GeminiRole;
  text: string;
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
      reason: "not_configured" | "upstream_error" | "timeout" | "invalid_response";
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
};

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
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
      message:
        "Gemini is not configured. Set GEMINI_API_KEY in the environment to enable cloud calls.",
    };
  }

  const apiKey = getApiKey();
  const model = input.model ?? getGeminiModel(input.task);
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const system = input.messages.find((m) => m.role === "system");
  const contents = input.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "model" ? "model" : "user", parts: [{ text: m.text }] }));

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
