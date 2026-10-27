import { reserveSpend, type BreakerOptions } from "@/lib/breaker";
import { hasUnlimitedDevUsage } from "@/lib/devUsage";
import {
  isConfigurationError,
  MIN_REQUEST_MS,
  type LlmCallInput,
  type LlmCallResult,
  type LlmProvider,
  type LlmTask,
  type ProviderContext,
} from "./types";

/**
 * The Google Gemini adapter. Everything in this file is Gemini's own: its request shape, its model
 * names, its quota wording and its retry behaviour. The provider-neutral entry point is `ai.ts`.
 */
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-3.5-flash";
const REQUEST_TIMEOUT_MS = 8_000;
/**
 * Per-attempt limits and the total budget, by task. Reading a scanned multi-page invoice routinely
 * takes longer than 8 s, so a check could time out while Google was healthy. The budgets stay
 * under the 60 s the two routes are given in vercel.json.
 */
const TASK_TIMEOUT_MS: Record<string, number> = {
  // Short enough that a stalled schema-mode attempt leaves room for the plain-JSON fallback below.
  "read-document": 25_000,
  "improve-wording": 12_000,
  "draft-poa": 25_000,
  // A short, anonymous, optional second reading: better none than a slow decode page.
  "classify-notice": 9_000,
};
const TASK_BUDGET_MS: Record<string, number> = {
  "read-document": 55_000,
  "improve-wording": 40_000,
  "draft-poa": 55_000,
  "classify-notice": 14_000,
};
const RETRY_DELAYS_MS = [1_500, 4_000];
const MAX_OUTPUT_TOKENS = 512;

/**
 * Call-site task tags. Each tag maps to the model measured best for that
 * workload (production runs the paid tier; the choice is about quality and
 * latency, not price). Callers pass `task` instead of a raw model id; the
 * resolver picks the right one. Per-task env overrides let ops swap a model
 * without code changes. The default model covers anything not in the table.
 * (`LlmTask` itself lives in `./types`: only the tasks the app actually calls.)
 */
const TASK_MODELS: Record<LlmTask, string> = {
  // AA-41: reading a scanned invoice is the hardest perception task in the product — a lite model
  // that mis-reads a date or a supplier name produces a confidently wrong finding, which is worse
  // than no finding at all. Deliberately the strongest flash tier.
  "read-document": "gemini-3.5-flash",
  // Rewording one section of a seller's own response (24 Sep 2026). Replaces "draft-poa-section",
  // which drafted whole sections and had not been able to run for any case since 22 Sep. A small
  // text task, but a mistake here is a sentence in an appeal, so not a lite model either.
  "improve-wording": "gemini-3.5-flash",
  // Writing the three narrative sections of a Plan of Action from the seller's own facts (7 Oct 2026).
  // The strongest flash tier: a weak model invents detail, and the fact check then discards its work.
  "draft-poa": "gemini-3.5-flash",
  // Choosing one of ten kinds from a notice and quoting the deciding sentence (9 Oct 2026).
  "classify-notice": "gemini-3.5-flash",
};

function envForTask(task: LlmTask): string | undefined {
  const key = `GEMINI_MODEL_${task.toUpperCase().replace(/-/g, "_")}`;
  const raw = process.env[key];
  return raw && raw.trim().length > 0 ? raw.trim() : undefined;
}

/**
 * The model to ask once when the task's own model is busy, stalls or is over its quota (29 Sep
 * 2026). Measured that day: gemini-3.5-flash, 3.6, 3.7 and 3.8 all answered 503 "high demand" or a
 * quota 429 for most requests, and a document check failed every time, while gemini-3-flash-preview
 * answered every request shape in 2 to 3 s and read the test invoice correctly. It is a full flash
 * model, not a lite one, for the reason `TASK_MODELS` gives. Quotas are per model, so a second
 * model also helps when the first has used its allowance.
 *
 * `GEMINI_FALLBACK_MODEL` replaces it, and `none` switches the fallback off.
 */
const FALLBACK_MODEL = "gemini-3-flash-preview";

export function getGeminiFallbackModel(): string | undefined {
  const raw = process.env.GEMINI_FALLBACK_MODEL?.trim();
  if (raw === "none") return undefined;
  return raw || FALLBACK_MODEL;
}

export function getGeminiModel(task?: LlmTask): string {
  if (task) {
    const override = envForTask(task);
    if (override) return override;
    return TASK_MODELS[task];
  }
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

/** This adapter's own daily allowance, counted per request that actually leaves for Google. */
export const breakerOptions: BreakerOptions = {
  name: "gemini",
  spendCapPerDay: 240,
  perMinuteLimit: 9,
  errorRateThreshold: 0.5,
  minVolumePerWindow: 10,
  windowMs: 60_000,
  cooldownMs: 30_000,
  scope: "user",
  // Counted in `callGeminiOnce`, only for a request that has passed sign-in and the Pass check and is
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

/** A key is present and, in production, billing has been confirmed. */
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

/** The adapter `ai.ts` calls. It may hand a failing first attempt to the next provider at once. */
export const geminiProvider: LlmProvider = {
  id: "gemini",
  isConfigured: isGeminiConfigured,
  supports: () => true,
  call: (input, context) => callGeminiOnce(input, context.tryFallback),
};

async function callGeminiOnce(
  input: LlmCallInput,
  tryFallback: ProviderContext["tryFallback"],
): Promise<LlmCallResult> {
  if (!process.env.GEMINI_API_KEY || !isPaidTierConfirmed()) {
    return {
      ok: false,
      reason: "not_configured",
      message: isPaidTierConfirmed()
        ? "Gemini is not configured. Set GEMINI_API_KEY in the environment to enable cloud calls."
        : "Gemini is switched off in production until GEMINI_PAID_TIER_CONFIRMED=true is set (DEPLOYMENT §6b).",
    };
  }

  const timeoutMs = TASK_TIMEOUT_MS[input.task ?? ""] ?? REQUEST_TIMEOUT_MS;
  // A caller that makes more than one call sets one deadline for all of them; otherwise this call's
  // task budget starts now.
  const deadline = input.deadline ?? Date.now() + (TASK_BUDGET_MS[input.task ?? ""] ?? timeoutMs);
  if (deadline - Date.now() < MIN_REQUEST_MS) {
    return {
      ok: false,
      reason: "timeout",
      message: "No time remained in the caller's budget for another AI request.",
    };
  }

  const budget = hasUnlimitedDevUsage() ? { ok: true } : await reserveSpend(breakerOptions);
  if (!budget.ok) {
    return {
      ok: false,
      reason: "spend_cap",
      message: "Today's allowance for AI reading is used up. It resets at midnight UTC.",
    };
  }

  const apiKey = getApiKey();
  const model = input.model ?? getGeminiModel(input.task);
  const urlFor = (m: string) => `${GEMINI_API_BASE}/models/${m}:generateContent?key=${apiKey}`;
  const url = urlFor(model);

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
  const thinking = { thinkingBudget: input.thinkingBudget ?? 0 };
  if (input.responseJsonSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = input.responseJsonSchema;
    generationConfig.thinkingConfig = thinking;
  } else if (input.responseJson) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.thinkingConfig = thinking;
  } else {
    generationConfig.responseMimeType = "text/plain";
    if (input.thinkingBudget !== undefined) generationConfig.thinkingConfig = thinking;
  }

  const body = {
    contents,
    systemInstruction: system ? { role: "system", parts: [{ text: system.text }] } : undefined,
    generationConfig,
  };

  /*
    25 Sep 2026, found walking the paid path: Google answered a real document check with 503 "This
    model is currently experiencing high demand", and the seller got a flat failure on the first
    try. A 429/5xx is Google saying "not now", so wait and try again a couple of times inside a
    fixed budget. The first request's spend is reserved above; each further request reserves its own.
  */
  let last: LlmCallResult = {
    ok: false,
    reason: "upstream_error",
    message: "Gemini was not called.",
  };
  // Each request that actually leaves for Google counts against the day's cap (6 Oct 2026). The
  // first was reserved above; a retry, the fallback model and the plain-JSON retry each reserve their
  // own, so a stalled call that sends five requests is counted as five. When the cap (or Redis)
  // refuses, no further request is sent: it fails closed.
  const mayRequestAgain = async (): Promise<boolean> =>
    hasUnlimitedDevUsage() || (await reserveSpend(breakerOptions)).ok;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0 && !(await mayRequestAgain())) break;
    const remaining = deadline - Date.now();
    if (remaining < MIN_REQUEST_MS) break;
    const outcome = await attemptOnce(url, body, model, Math.min(timeoutMs, remaining));
    last = outcome.result;
    if (!last.ok && attempt === 0) {
      const configurationError = isConfigurationError(last);
      if (last.reason !== "bad_input" || configurationError) {
        const alternative = await tryFallback();
        if (alternative) return alternative;
      }
    }
    const delay = RETRY_DELAYS_MS[attempt];
    if (last.ok || !outcome.retryable || delay === undefined) break;
    if (Date.now() + delay + 2_000 > deadline) break;
    await new Promise((r) => setTimeout(r, delay));
  }
  // A 429 for an exhausted quota is not "busy": it will not clear in a minute, so it is neither
  // retried (see attemptOnce) nor worded as "try again in a minute" to the seller.
  const busy =
    !last.ok &&
    last.reason === "upstream_error" &&
    /^Gemini returned (429|5\d\d)/.test(last.message) &&
    !isQuotaMessage(last.message);
  const overQuota = !last.ok && last.reason === "upstream_error" && isQuotaMessage(last.message);

  // Another model before another request shape: when the model itself is overloaded, rewording
  // the request to it does not help. An explicitly chosen model is the caller's, so it is kept.
  const fallbackModel = input.model ? undefined : getGeminiFallbackModel();
  if (
    !last.ok &&
    fallbackModel &&
    fallbackModel !== model &&
    (busy || overQuota || last.reason === "timeout") &&
    deadline - Date.now() > 5_000 &&
    (await mayRequestAgain())
  ) {
    console.warn(
      `[gemini] ${input.task ?? "default"}: ${model} ${overQuota ? "is over its quota" : busy ? "is busy" : "stalled"}, asking ${fallbackModel}`,
    );
    const outcome = await attemptOnce(
      urlFor(fallbackModel),
      body,
      fallbackModel,
      Math.min(timeoutMs, deadline - Date.now()),
    );
    if (outcome.result.ok) return outcome.result;
    console.warn(
      `[gemini] ${input.task ?? "default"}: ${fallbackModel} failed too: ${outcome.result.message.replace(/key=[^&\s]+/g, "key=***")}`,
    );
  }

  /*
    25 Sep 2026: with the paid key confirmed, every schema-constrained request to gemini-3.5-flash
    hung until it timed out, while the same prompt in plain JSON mode answered in about 3 s. Both
    callers validate the JSON they get back (Zod) and refuse anything malformed, so the schema is a
    second layer, not the only one. When it stalls, ask once more in plain JSON mode with the schema
    written into the instructions, and let the caller's validation decide as it always has.
  */
  const schema = input.responseJsonSchema;
  if (
    !last.ok &&
    schema &&
    (last.reason === "timeout" || busy) &&
    deadline - Date.now() > 5_000 &&
    (await mayRequestAgain())
  ) {
    console.warn(
      `[gemini] ${input.task ?? "default"}: schema mode stalled, retrying as plain JSON`,
    );
    const plainConfig: Record<string, unknown> = { ...generationConfig };
    delete plainConfig.responseSchema;
    const fallback = {
      ...body,
      systemInstruction: {
        role: "system",
        parts: [
          {
            text: `${system?.text ?? ""}\n\nReply with a single JSON object that matches this JSON Schema exactly, and nothing else:\n${JSON.stringify(schema)}`.trim(),
          },
        ],
      },
      generationConfig: plainConfig,
    };
    const outcome = await attemptOnce(
      url,
      fallback,
      model,
      Math.min(timeoutMs, deadline - Date.now()),
    );
    if (outcome.result.ok) return outcome.result;
  }

  if (busy) return { ...(last as Extract<LlmCallResult, { ok: false }>), reason: "busy" };
  return last;
}

/** Google's wording for a project that has used up its allowance (typically a free-tier key). */
function isQuotaMessage(text: string): boolean {
  return /exceeded your current quota|check your plan and billing/i.test(text);
}

/** One request. `retryable` is true only for Google's "not now" answers and dropped connections. */
async function attemptOnce(
  url: string,
  body: unknown,
  model: string,
  timeoutMs: number,
): Promise<{ result: LlmCallResult; retryable: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1_000, timeoutMs));
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // A 4xx other than "slow down" / "timed out" means Google refused this request's content (a
      // corrupt or protected file, say). That is the caller's input, not a provider outage, and it
      // must not count against the shared circuit breaker (6 Oct 2026).
      if (res.status >= 400 && res.status < 500 && res.status !== 429 && res.status !== 408) {
        return {
          retryable: false,
          result: {
            ok: false,
            reason: "bad_input",
            message: `Gemini returned ${res.status}: ${text.slice(0, 200)}`,
          },
        };
      }
      return {
        retryable: (res.status === 429 && !isQuotaMessage(text)) || res.status >= 500,
        result: {
          ok: false,
          reason: "upstream_error",
          message: `Gemini returned ${res.status}: ${text.slice(0, 200)}`,
        },
      };
    }

    const data: unknown = await res.json();
    const parsed = parseGeminiResponse(data);
    if (!parsed) {
      return {
        retryable: false,
        result: {
          ok: false,
          reason: "invalid_response",
          message: "Gemini response did not match expected shape.",
        },
      };
    }
    return {
      retryable: false,
      result: { ok: true, text: parsed.text, model, usage: parsed.usage },
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        retryable: false,
        result: { ok: false, reason: "timeout", message: `Gemini timed out after ${timeoutMs}ms.` },
      };
    }
    return {
      retryable: true,
      result: {
        ok: false,
        reason: "upstream_error",
        message: err instanceof Error ? err.message : "Unknown network error.",
      },
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

export const __test = { parseGeminiResponse, breakerOptions, TASK_MODELS, envForTask };
