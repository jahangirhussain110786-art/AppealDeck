import { reserveSpend } from "@/lib/breaker";
import { hasUnlimitedDevUsage } from "@/lib/devUsage";
import { chatCompletion, type ChatMessage, type ChatPart } from "./openaiCompat";
import {
  deadlineFor,
  fallbackModelFor,
  jsonInstruction,
  modelFor,
  productionConfirmed,
  sleep,
  taskTimeoutMs,
} from "./providerSupport";
import { MIN_REQUEST_MS, type LlmCallInput, type LlmCallResult, type LlmProvider } from "./types";

/**
 * The OpenAI adapter, 27 Oct 2026, over the chat-completions API (`openaiCompat.ts`). It is built
 * from the published request format and covered by unit tests with a stand-in server; it has not
 * been run against the live API from this repository, so the first live check and the evaluation
 * harness (`AI_EVAL=1`) are part of switching to it. It cannot run in production until it is listed
 * in `src/content/aiProviders.ts` and `OPENAI_PRODUCTION_CONFIRMED=true`.
 *
 * There is no default model: the right one changes faster than this file, so `OPENAI_MODEL` must be
 * set (`OPENAI_MODEL_<TASK>` overrides it per task, `OPENAI_FALLBACK_MODEL` adds a second one).
 */
const API_URL = "https://api.openai.com/v1/chat/completions";
const RETRY_DELAY_MS = 1_500;

export function isOpenAiConfigured(): boolean {
  return (
    Boolean(process.env.OPENAI_API_KEY?.trim()) &&
    Boolean(process.env.OPENAI_MODEL?.trim()) &&
    productionConfirmed("OPENAI_PRODUCTION_CONFIRMED")
  );
}

const spendOptions = {
  name: "openai",
  spendCapPerDay: 240,
  perMinuteLimit: 0,
  errorRateThreshold: 0.5,
  minVolumePerWindow: 10,
  windowMs: 60_000,
  cooldownMs: 30_000,
  scope: "user",
  spendCountedAt: "call",
} as const;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function buildMessages(
  input: LlmCallInput,
): { ok: true; messages: ChatMessage[] } | { ok: false; message: string } {
  const messages: ChatMessage[] = [];
  for (const m of input.messages) {
    if (m.role === "system") {
      messages.push({ role: "system", content: m.text });
      continue;
    }
    const role = m.role === "model" ? "assistant" : "user";
    if (!m.documents?.length) {
      messages.push({ role, content: m.text });
      continue;
    }
    const parts: ChatPart[] = [{ type: "text", text: m.text }];
    for (const d of m.documents) {
      const url = `data:${d.mimeType};base64,${d.data}`;
      if (d.mimeType === "application/pdf") {
        parts.push({ type: "file", file: { filename: "document.pdf", file_data: url } });
      } else if (IMAGE_TYPES.has(d.mimeType)) {
        parts.push({ type: "image_url", image_url: { url } });
      } else {
        return { ok: false, message: `OpenAI cannot read a ${d.mimeType} file.` };
      }
    }
    messages.push({ role, content: parts });
  }
  const instruction = jsonInstruction(input);
  if (instruction) messages.unshift({ role: "system", content: instruction });
  return { ok: true, messages };
}

export async function callOpenAi(input: LlmCallInput): Promise<LlmCallResult> {
  if (!isOpenAiConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message:
        "OpenAI is not configured. Set OPENAI_API_KEY and OPENAI_MODEL (and, in production, OPENAI_PRODUCTION_CONFIRMED=true).",
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
  const built = buildMessages(input);
  if (!built.ok) return { ok: false, reason: "bad_input", message: built.message };

  const primary = input.model ?? (modelFor("OPENAI", input.task) as string);
  const second = input.model ? undefined : fallbackModelFor("OPENAI");
  const models = second && second !== primary ? [primary, second] : [primary];
  const timeoutMs = taskTimeoutMs(input.task);

  let last: LlmCallResult = {
    ok: false,
    reason: "upstream_error",
    message: "OpenAI was not called.",
  };
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if ((attempt > 0 || model !== primary) && !hasUnlimitedDevUsage()) {
        if (!(await reserveSpend(spendOptions)).ok) return last;
      }
      const remaining = deadline - Date.now();
      if (remaining < MIN_REQUEST_MS) return last;
      last = await chatCompletion({
        label: "OpenAI",
        url: API_URL,
        apiKey: process.env.OPENAI_API_KEY as string,
        model,
        modelTag: `openai:${model}`,
        messages: built.messages,
        input,
        baseTimeoutMs: Math.min(timeoutMs, remaining),
        classifyClientErrors: true,
      });
      if (last.ok) return last;
      // Only "not now" answers are worth a second try; a refusal or an unreadable answer is final.
      if (last.reason !== "busy" && last.reason !== "upstream_error") return last;
      if (deadline - Date.now() < RETRY_DELAY_MS + 2_000) break;
      await sleep(RETRY_DELAY_MS);
    }
  }
  return last;
}

export const openaiProvider: LlmProvider = {
  id: "openai",
  isConfigured: isOpenAiConfigured,
  supports: () => true,
  call: (input) => callOpenAi(input),
};

export const __test = { buildMessages };
