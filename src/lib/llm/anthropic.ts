import { reserveSpend } from "@/lib/breaker";
import { hasUnlimitedDevUsage } from "@/lib/devUsage";
import {
  deadlineFor,
  fallbackModelFor,
  jsonInstruction,
  modelFor,
  productionConfirmed,
  sleep,
  taskTimeoutMs,
} from "./providerSupport";
import {
  DEFAULT_MAX_OUTPUT_TOKENS,
  MIN_REQUEST_MS,
  type LlmCallInput,
  type LlmCallResult,
  type LlmProvider,
} from "./types";

/**
 * The Claude (Anthropic) adapter, 27 Oct 2026. It speaks Anthropic's Messages API over plain fetch.
 * It is built from the published request format and covered by unit tests with a stand-in server; it
 * has not been run against the live API from this repository, so the first live check (and the
 * evaluation harness, `AI_EVAL=1`) is part of switching to it. See `src/content/aiProviders.ts`:
 * it cannot run in production until it is listed there and `ANTHROPIC_PRODUCTION_CONFIRMED=true`.
 */
const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-5-5";
const DEFAULT_FALLBACK_MODEL = "claude-haiku-5-5";
const RETRY_DELAY_MS = 1_500;

export function isAnthropicConfigured(): boolean {
  return (
    Boolean(process.env.ANTHROPIC_API_KEY?.trim()) &&
    productionConfirmed("ANTHROPIC_PRODUCTION_CONFIRMED")
  );
}

const spendOptions = {
  name: "anthropic",
  spendCapPerDay: 240,
  perMinuteLimit: 0,
  errorRateThreshold: 0.5,
  minVolumePerWindow: 10,
  windowMs: 60_000,
  cooldownMs: 30_000,
  scope: "user",
  spendCountedAt: "call",
} as const;

type Block =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: string; data: string } };

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function buildBody(
  input: LlmCallInput,
  model: string,
): { ok: true; body: Record<string, unknown> } | { ok: false; message: string } {
  const systemParts = input.messages.filter((m) => m.role === "system").map((m) => m.text);
  const instruction = jsonInstruction(input);
  if (instruction) systemParts.push(instruction);

  const messages: { role: "user" | "assistant"; content: Block[] }[] = [];
  for (const m of input.messages) {
    if (m.role === "system") continue;
    const content: Block[] = [];
    // Documents first, then the instruction: Anthropic's own guidance for document questions.
    for (const d of m.documents ?? []) {
      if (d.mimeType === "application/pdf") {
        content.push({
          type: "document",
          source: { type: "base64", media_type: d.mimeType, data: d.data },
        });
      } else if (IMAGE_TYPES.has(d.mimeType)) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: d.mimeType, data: d.data },
        });
      } else {
        return { ok: false, message: `Claude cannot read a ${d.mimeType} file.` };
      }
    }
    content.push({ type: "text", text: m.text });
    messages.push({ role: m.role === "model" ? "assistant" : "user", content });
  }

  return {
    ok: true,
    body: {
      model,
      max_tokens: input.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      temperature: input.temperature ?? 0.2,
      ...(systemParts.length ? { system: systemParts.join("\n\n") } : {}),
      messages,
    },
  };
}

type Attempt = { result: LlmCallResult; retryable: boolean };

async function attemptOnce(
  body: Record<string, unknown>,
  model: string,
  timeoutMs: number,
): Promise<Attempt> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1_000, timeoutMs));
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": API_VERSION,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status >= 400 && res.status < 500 && res.status !== 429 && res.status !== 408) {
        return {
          retryable: false,
          result: {
            ok: false,
            reason: "bad_input",
            message: `Claude returned ${res.status}: ${text.slice(0, 200)}`,
          },
        };
      }
      // 429 (rate limit), 529 (overloaded) and 5xx are the provider saying "not now".
      return {
        retryable: true,
        result: {
          ok: false,
          reason: "upstream_error",
          message: `Claude returned ${res.status}: ${text.slice(0, 200)}`,
        },
      };
    }
    const data = (await res.json()) as {
      content?: { type?: string; text?: unknown }[];
      stop_reason?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = (data.content ?? [])
      .map((part) => (part?.type === "text" && typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();
    // A cut-off answer is not an answer: a half-written JSON object would fail its caller anyway.
    if (!text || data.stop_reason === "max_tokens") {
      return {
        retryable: false,
        result: {
          ok: false,
          reason: "invalid_response",
          message: "Claude returned no complete answer.",
        },
      };
    }
    return {
      retryable: false,
      result: {
        ok: true,
        text,
        model: `anthropic:${model}`,
        ...(data.usage
          ? {
              usage: {
                inputTokens: Number(data.usage.input_tokens ?? 0),
                outputTokens: Number(data.usage.output_tokens ?? 0),
              },
            }
          : {}),
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        retryable: false,
        result: { ok: false, reason: "timeout", message: `Claude timed out after ${timeoutMs}ms.` },
      };
    }
    return {
      retryable: true,
      result: {
        ok: false,
        reason: "upstream_error",
        message: "Claude could not complete the request.",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function callAnthropic(input: LlmCallInput): Promise<LlmCallResult> {
  if (!isAnthropicConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message:
        "Claude is not configured. Set ANTHROPIC_API_KEY (and, in production, ANTHROPIC_PRODUCTION_CONFIRMED=true).",
    };
  }
  const deadline = deadlineFor(input);
  if (deadline - Date.now() < MIN_REQUEST_MS) {
    return {
      ok: false,
      reason: "timeout",
      message: "No time remained in the caller's budget for another AI request.",
    };
  }
  if (!hasUnlimitedDevUsage() && !(await reserveSpend(spendOptions)).ok) {
    return {
      ok: false,
      reason: "spend_cap",
      message: "Today's allowance for AI reading is used up. It resets at midnight UTC.",
    };
  }

  const primary = input.model ?? modelFor("ANTHROPIC", input.task, DEFAULT_MODEL) ?? DEFAULT_MODEL;
  const second = input.model ? undefined : fallbackModelFor("ANTHROPIC", DEFAULT_FALLBACK_MODEL);
  const models = second && second !== primary ? [primary, second] : [primary];
  const timeoutMs = taskTimeoutMs(input.task);

  let last: LlmCallResult = {
    ok: false,
    reason: "upstream_error",
    message: "Claude was not called.",
  };
  for (const model of models) {
    const built = buildBody(input, model);
    if (!built.ok) return { ok: false, reason: "bad_input", message: built.message };
    for (let attempt = 0; attempt < 2; attempt++) {
      // Each request that leaves counts against the day's allowance; the first was reserved above.
      if ((attempt > 0 || model !== primary) && !hasUnlimitedDevUsage()) {
        if (!(await reserveSpend(spendOptions)).ok) return last;
      }
      const remaining = deadline - Date.now();
      if (remaining < MIN_REQUEST_MS) return last;
      const outcome = await attemptOnce(built.body, model, Math.min(timeoutMs, remaining));
      last = outcome.result;
      if (last.ok) return last;
      if (!outcome.retryable || deadline - Date.now() < RETRY_DELAY_MS + 2_000) break;
      await sleep(RETRY_DELAY_MS);
    }
    // Another model only for a limit, an outage or a stall; a refusal of the request itself ends it.
    if (last.ok || last.reason === "bad_input" || last.reason === "invalid_response") return last;
  }
  if (
    !last.ok &&
    last.reason === "upstream_error" &&
    /returned (429|529|5\d\d)/.test(last.message)
  ) {
    return { ...last, reason: "busy" };
  }
  return last;
}

export const anthropicProvider: LlmProvider = {
  id: "anthropic",
  isConfigured: isAnthropicConfigured,
  supports: () => true,
  call: (input) => callAnthropic(input),
};

export const __test = { buildBody };
