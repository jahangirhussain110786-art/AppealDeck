import type { NextRequest } from "next/server";
import { withBreaker, type BreakerContext, type BreakerOptions } from "@/lib/breaker";
import { hasUnlimitedDevUsage, withDevUsage } from "@/lib/devUsage";
import { isProviderListed } from "@/content/aiProviders";
import { anthropicProvider } from "./anthropic";
import { geminiProvider } from "./gemini";
import { groqProvider } from "./groq";
import { openaiProvider } from "./openai";
import {
  isConfigurationError,
  MIN_REQUEST_MS,
  type LlmCallInput,
  type LlmCallResult,
  type LlmProvider,
  type LlmTask,
  type ProviderId,
} from "./types";

/**
 * The one place the app asks for an AI answer (27 Oct 2026). Callers say what they want in neutral
 * terms (`LlmCallInput`); this file decides which company's model answers, in what order, and what
 * happens when one cannot. No page, route or prompt names a provider.
 *
 * Which providers run is deployment configuration, not code:
 *   AI_PROVIDERS=gemini,groq        the order they are asked in (this is the default)
 *   AI_PROVIDERS=anthropic,gemini   Claude first, Gemini when Claude cannot answer
 *   AI_PROVIDERS_DRAFT_POA=anthropic   one task with its own order (tasks: DRAFT_POA, READ_DOCUMENT,
 *                                      IMPROVE_WORDING, CLASSIFY_NOTICE)
 * and each provider has its own key and its own switch that says someone has read its data terms
 * (DEPLOYMENT §6b). A provider is skipped when it is not configured or cannot take the request (Groq
 * never receives a document). In production a provider also has to be `listed` in
 * `src/content/aiProviders.ts`, which is what puts it in the privacy policy: text can never go to
 * a company the policy does not name.
 */
export type {
  LlmCallInput,
  LlmCallResult,
  LlmInlineDocument,
  LlmMessage,
  LlmRole,
  LlmTask,
  ProviderId,
} from "./types";

const PROVIDERS: Record<ProviderId, LlmProvider> = {
  gemini: geminiProvider,
  anthropic: anthropicProvider,
  openai: openaiProvider,
  groq: groqProvider,
};

const DEFAULT_ORDER: ProviderId[] = ["gemini", "groq"];

/**
 * The order named in `AI_PROVIDERS`, unknown names and repeats dropped. A task can have its own
 * order in `AI_PROVIDERS_<TASK>` (task name upper-cased, dashes to underscores, e.g.
 * `AI_PROVIDERS_READ_DOCUMENT=gemini`); a task without one uses the general order.
 */
export function providerOrder(task?: LlmTask): ProviderId[] {
  const named = (raw: string | undefined): ProviderId[] => {
    const seen = new Set<ProviderId>();
    for (const part of (raw ?? "").split(",")) {
      const id = part.trim().toLowerCase() as ProviderId;
      if (id in PROVIDERS) seen.add(id);
    }
    return [...seen];
  };
  const forTask = task
    ? named(process.env[`AI_PROVIDERS_${task.toUpperCase().replace(/-/g, "_")}`])
    : [];
  if (forTask.length > 0) return forTask;
  const general = named(process.env.AI_PROVIDERS);
  return general.length > 0 ? general : DEFAULT_ORDER;
}

/** In production only a provider the privacy policy names may receive anything. */
function mayRun(id: ProviderId): boolean {
  return process.env.NODE_ENV !== "production" || isProviderListed(id);
}

/** The providers that would be asked for this request, in order. */
export function providerChain(input: LlmCallInput): LlmProvider[] {
  return providerOrder(input.task)
    .filter(mayRun)
    .map((id) => PROVIDERS[id])
    .filter((provider) => provider.isConfigured() && provider.supports(input));
}

/** Whether any AI provider could answer a text request right now. */
export function isAiConfigured(task?: LlmTask): boolean {
  return providerOrder(task)
    .filter(mayRun)
    .some((id) => PROVIDERS[id].isConfigured());
}

export async function callLlm(input: LlmCallInput): Promise<LlmCallResult> {
  const chain = providerChain(input);
  // With nothing configured the first provider named is still asked, so the answer is its own
  // "not configured" message (which says which key to set) rather than a generic one.
  const firstNamed = PROVIDERS[providerOrder(input.task)[0] ?? "gemini"];
  const [primary = firstNamed, ...rest] = chain;

  // A spent budget means no further provider is asked: the answer would arrive after the caller
  // has already given up, and the next provider would reserve spend for a request nobody can use.
  const timeLeft = () =>
    input.deadline === undefined || input.deadline - Date.now() >= MIN_REQUEST_MS;
  let alternative: LlmCallResult | undefined;
  let askedAlternative = false;
  const tryFallback = async (): Promise<LlmCallResult | undefined> => {
    if (askedAlternative) return alternative;
    if (rest.length === 0 || !timeLeft()) return undefined;
    askedAlternative = true;
    for (const provider of rest) {
      if (!timeLeft()) break;
      const outcome = await provider.call(input, { tryFallback: async () => undefined });
      alternative = outcome;
      if (outcome.ok) break;
      // Our own request was refused: the next provider would refuse it too.
      if (outcome.reason === "bad_input" && !isConfigurationError(outcome)) break;
    }
    return alternative;
  };

  let result = await primary.call(input, { tryFallback });
  if (!result.ok && timeLeft() && (result.reason !== "bad_input" || isConfigurationError(result))) {
    result = (await tryFallback()) ?? result;
  }
  if (result.ok && process.env.NODE_ENV !== "production") {
    // Local testing only: which provider answered which task, so a fallback is visible.
    console.info(`[ai] ${input.task ?? "default"} answered by ${result.model}`);
  }
  if (!result.ok) {
    console.warn(
      `[ai] ${input.task ?? "default"} failed: ${result.reason} — ${result.message.replace(/key=[^&\s]+/g, "key=***")}`,
    );
  }
  return result;
}

/**
 * The per-route circuit breaker and rate limit. Its name is shared by every AI route, so one
 * provider's outage opening it stops the others' requests too; a text request that has another
 * provider to fall to uses a separate breaker, so that fallback stays reachable.
 */
export const breakerOptions: BreakerOptions = {
  name: "ai",
  spendCapPerDay: 240,
  perMinuteLimit: 9,
  errorRateThreshold: 0.5,
  minVolumePerWindow: 10,
  windowMs: 60_000,
  cooldownMs: 30_000,
  scope: "user",
  // Counted by each adapter, only for a request that has passed sign-in and the Pass check and is
  // about to reach a provider. See `reserveSpend`.
  spendCountedAt: "call",
};

export type AiRouteHandler = (req: NextRequest, ctx: BreakerContext) => Promise<Response>;

export function withAiBreaker(handler: AiRouteHandler, task?: LlmTask): AiRouteHandler {
  return withDevUsage(async (req: NextRequest, ctx: BreakerContext) => {
    if (hasUnlimitedDevUsage()) return handler(req, ctx);
    const hasFallback =
      task !== "read-document" && providerChain({ messages: [], task }).length > 1;
    const options = hasFallback ? { ...breakerOptions, name: "ai-text" } : breakerOptions;
    return withBreaker(options, handler)(req, ctx);
  });
}

export const __test = { PROVIDERS, DEFAULT_ORDER, mayRun };
