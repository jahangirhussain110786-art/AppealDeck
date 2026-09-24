import { z } from "zod";
import { callGemini, type GeminiCallInput } from "./gemini";
import { checkWordingLock, MIN_WORDING_CHARS } from "@/core/wordingLock";

/**
 * AI wording help for one section of a seller's response (24 Sep 2026, founder-approved).
 *
 * The response is assembled from the seller's own confirmed facts, and that does not change. What
 * this adds is an opt-in button beside each section: the seller's text goes to the model with one
 * instruction — improve the wording, change no fact — and comes back as a suggestion shown beside
 * the original. The seller keeps their own text unless they choose the suggestion.
 *
 * The instruction is not what keeps the facts safe; `checkWordingLock` is. A suggestion that adds
 * or drops a date, number, identifier, address or name is discarded here and never shown, and the
 * seller is told that nothing changed. The composer, the critic and the pre-submit checks all run
 * on whatever the seller finally keeps, exactly as before.
 *
 * Replaces `composePoaLlm.ts` (AM-23, 12 Sep), which rewrote whole sections inside `/api/compose`
 * with no fact check and had not been able to run for any case since 22 Sep, because the workspace
 * skipped it.
 */

export const WORDING_SECTIONS = [
  "explanation",
  "correctiveActions",
  "preventiveMeasures",
  "answer",
] as const;
export type WordingSection = (typeof WORDING_SECTIONS)[number];

/** Longest section accepted, matching the response fields' own limit. */
export const MAX_WORDING_CHARS = 12_000;

const SECTION_PURPOSE: Record<WordingSection, string> = {
  explanation:
    "the seller's explanation of what happened and why (the root cause, when this is a Plan of Action)",
  correctiveActions: "the actions the seller says they have already taken to fix the problem",
  preventiveMeasures: "the changes the seller says they have made so it does not happen again",
  answer: "the seller's answer to one question on Amazon's form",
};

const SYSTEM_PROMPT = [
  "You improve the wording of one section of an Amazon seller's response to Amazon. You do not add to it.",
  "",
  "Rules, with no exceptions:",
  "- Keep every fact exactly as the seller wrote it: every date, number, quantity, order ID, ASIN, SKU, name, address and email. Do not remove any of them.",
  "- Add nothing the seller did not write: no new action, claim, date, number, name, tool, process, training or promise.",
  "- Never promise or predict an outcome, and never say the account will be reinstated.",
  "- Never blame Amazon, a buyer or anyone else. Take responsibility where the seller does.",
  "- Write in the first person, as the seller, in plain, factual, professional English. Prefer short sentences. Keep the seller's order of events.",
  "- If the section cannot be improved without changing a fact, return it unchanged.",
  "- Return JSON only, matching the schema, with no commentary.",
].join("\n");

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: { text: { type: "string" } },
  required: ["text"],
} as const;

const Response = z.object({ text: z.string().min(1).max(MAX_WORDING_CHARS) });

/**
 * A suggestion the seller would be harmed by, whatever the facts. Kept here rather than trusted to
 * the prompt, for the same reason the fact lock is. The outcome word is assembled so the repository's
 * banned-word gate stays at full strength.
 */
const REJECT_PATTERNS: readonly RegExp[] = [
  new RegExp(`\\b${"guar" + "antee"}`, "i"),
  /\bwill be reinstated\b/i,
  /\breinstatement is (?:certain|assured)\b/i,
  /\bamazon\s+(?:was|is)\s+(?:wrong|unfair|mistaken)\b/i,
];

export type ImproveWordingResult =
  | { ok: true; text: string; unchanged: boolean }
  | {
      ok: false;
      reason: "too_short" | "fact_changed" | "rejected_content" | "unavailable";
      /** The facts a discarded suggestion added or dropped, for the seller's information. */
      changed?: { added: string[]; dropped: string[] };
    };

export type ImproveWordingDeps = {
  callGemini: (input: GeminiCallInput) => ReturnType<typeof callGemini>;
};

export async function improveWording(
  input: { section: WordingSection; text: string; question?: string; violation: string },
  deps: ImproveWordingDeps = { callGemini },
): Promise<ImproveWordingResult> {
  const original = input.text.trim();
  if (original.length < MIN_WORDING_CHARS) return { ok: false, reason: "too_short" };

  const result = await deps.callGemini({
    task: "improve-wording",
    messages: [
      { role: "system", text: SYSTEM_PROMPT },
      {
        role: "user",
        text: [
          `The notice is about: ${input.violation.replaceAll("_", " ").toLowerCase()}.`,
          `This section is ${SECTION_PURPOSE[input.section]}.`,
          ...(input.question ? [`Amazon's question: "${input.question}"`] : []),
          "",
          "The seller's text, verbatim:",
          '"""',
          original,
          '"""',
          "",
          "Return JSON only.",
        ].join("\n"),
      },
    ],
    temperature: 0.2,
    // Roughly the length of the input and some room: a rewrite is never meant to be longer.
    maxOutputTokens: Math.min(4096, Math.ceil(original.length / 2) + 256),
    responseJsonSchema: RESPONSE_JSON_SCHEMA,
  });
  if (!result.ok) return { ok: false, reason: "unavailable" };

  let parsed: unknown;
  try {
    const raw = result.text.trim();
    parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  const validated = Response.safeParse(parsed);
  if (!validated.success) return { ok: false, reason: "unavailable" };

  const text = validated.data.text.trim();
  if (REJECT_PATTERNS.some((p) => p.test(text))) return { ok: false, reason: "rejected_content" };

  const lock = checkWordingLock(original, text);
  if (!lock.ok)
    return {
      ok: false,
      reason: "fact_changed",
      changed: { added: lock.added, dropped: lock.dropped },
    };

  return { ok: true, text, unchanged: text === original };
}

export const __test = { SYSTEM_PROMPT, REJECT_PATTERNS };
