import { z } from "zod";
import { callGemini, type GeminiCallInput } from "./gemini";
import type { CaseFileData, PoaDraft } from "@/core";
import { isNarrativeSufficient, isNarrativeTextSufficient } from "@/core";

/**
 * Real AI-drafted composer (Task 4 / AM-23 — founder-authorized 12 Sep 2026, chat: "whatever it
 * is fix this any way and make sure there we get a real POA, not just text").
 *
 * `composePoa()` (src/core/composer.ts) stays exactly as it was: a deterministic, always-available
 * fallback that prints the seller's own words verbatim. This module is the layer on top of it —
 * an LLM call that rewrites the Root Cause and Preventive Measures sections into professional
 * appeal prose, grounded ONLY in facts the seller actually provided. It never touches Corrective
 * Actions (already built from real, checkable action items with attestation — D6, never invented)
 * or the Evidence Gaps section (deterministic, evidence-based). If the seller's narrative is too
 * thin to draft from, or Gemini is unconfigured, times out, or returns something that fails
 * validation, the caller falls back to the deterministic draft automatically — never a hard
 * failure, matching the D9 "rules-only degradation floor."
 */

const MAX_SECTION_CHARS = 4_000;

const DraftSectionsSchema = z.object({
  rootCause: z.string().min(1).max(MAX_SECTION_CHARS),
  preventiveMeasures: z.string().max(MAX_SECTION_CHARS).optional(),
});

export type ComposePoaLlmSections = z.infer<typeof DraftSectionsSchema>;

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    rootCause: { type: "string" },
    preventiveMeasures: { type: "string" },
  },
  required: ["rootCause"],
} as const;

// Defense in depth: the deterministic critic (critiquePoa) still runs on whatever comes out of
// this path, but a bad completion should never even reach that stage if we can catch it here
// first. Mirrors composer.ts's own BANNED_PATTERNS — kept as a separate, smaller list because
// this module must not import from composer.ts's private scope.
const REJECT_PATTERNS: readonly RegExp[] = [
  /\bguarantee\b/i,
  /\bwill be reinstated\b/i,
  /\b(amazon\s*(sucks?|is\s*(wrong|unfair)))\b/i,
];

export type ComposePoaLlmResult =
  { ok: true; sections: ComposePoaLlmSections } | { ok: false; reason: string };

function presentEvidenceKinds(data: CaseFileData): string[] {
  return Object.entries(data.evidenceSlots)
    .filter(([, slot]) => slot?.present)
    .map(([kind]) => kind.replace(/_/g, " "));
}

const SYSTEM_PROMPT = `You are drafting two sections of an Amazon seller's Plan of Action appeal, using ONLY the facts given to you below. Rules, no exceptions:
- Never state a fact, date, number, or claim that is not explicitly present in the facts given.
- Never promise an outcome, a timeline, or that the account will be reinstated.
- Never blame Amazon or use unprofessional language.
- Write in first person, as the seller, in a plain, factual, professional tone.
- "preventiveMeasures" must be omitted entirely if the seller's own preventive-measures answer was empty or not provided — never invent one.
- Return JSON only, matching the given schema, with no extra commentary.`;

function buildUserPrompt(data: CaseFileData): string {
  const lines: string[] = [`Violation kind: ${data.kind}`];

  lines.push(`Seller's root-cause answer (verbatim): "${(data.rootCause ?? "").trim()}"`);

  if (data.timelineEvents && data.timelineEvents.length > 0) {
    const events = data.timelineEvents.map((e) => `- ${e.date}: ${e.description}`).join("\n");
    lines.push(`Timeline the seller provided:\n${events}`);
  }

  const preventive = (data.preventiveMeasures ?? "").trim();
  lines.push(
    preventive
      ? `Seller's preventive-measures answer (verbatim): "${preventive}"`
      : "Seller's preventive-measures answer: (not provided — omit preventiveMeasures from your response)",
  );

  const evidence = presentEvidenceKinds(data);
  lines.push(
    evidence.length > 0
      ? `Evidence already attached to the case: ${evidence.join(", ")}`
      : "Evidence already attached to the case: none",
  );

  lines.push("Return JSON only.");
  return lines.join("\n\n");
}

export type ComposePoaLlmDeps = {
  callGemini: (input: GeminiCallInput) => ReturnType<typeof callGemini>;
};

/**
 * Calls Gemini to draft Root Cause / Preventive Measures. Returns `{ ok: false }` — never
 * throws — for every failure mode (thin narrative, unconfigured, upstream error, malformed JSON,
 * schema mismatch, a rejected phrase). The caller is expected to fall back to the deterministic
 * draft on any `ok: false` result.
 */
export async function composePoaWithLlm(
  data: CaseFileData,
  deps: ComposePoaLlmDeps = { callGemini },
): Promise<ComposePoaLlmResult> {
  if (!isNarrativeSufficient(data)) {
    return { ok: false, reason: "narrative_insufficient" };
  }

  const result = await deps.callGemini({
    task: "draft-poa-section",
    messages: [
      { role: "system", text: SYSTEM_PROMPT },
      { role: "user", text: buildUserPrompt(data) },
    ],
    temperature: 0.3,
    maxOutputTokens: 900,
    responseJsonSchema: RESPONSE_JSON_SCHEMA,
  });

  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }

  const raw = result.text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    return { ok: false, reason: "invalid_response" };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  } catch {
    return { ok: false, reason: "invalid_response" };
  }

  const validated = DraftSectionsSchema.safeParse(parsedJson);
  if (!validated.success) {
    return { ok: false, reason: "schema_mismatch" };
  }

  const { rootCause, preventiveMeasures } = validated.data;
  const fullText = `${rootCause}\n${preventiveMeasures ?? ""}`;
  if (REJECT_PATTERNS.some((p) => p.test(fullText))) {
    return { ok: false, reason: "rejected_content" };
  }

  // Never let the AI invent preventive measures the seller never gave, even if the model
  // ignored the system instruction and returned one anyway.
  const sections: ComposePoaLlmSections = {
    rootCause,
    ...(isNarrativeTextSufficient(data.preventiveMeasures) && preventiveMeasures
      ? { preventiveMeasures }
      : {}),
  };

  return { ok: true, sections };
}

/**
 * Merges an accepted LLM result into an already-built deterministic draft: replaces the Root
 * Cause body, and the Preventive Measures body only when the seller's own answer was sufficient
 * (never fabricate a preventive-measures section for a seller who didn't provide one). Every
 * other section (Corrective Actions, Evidence Gaps, watermark) is left untouched.
 */
export function applyLlmSections(
  draft: PoaDraft,
  data: CaseFileData,
  sections: ComposePoaLlmSections,
): PoaDraft {
  const nextSections = draft.sections.map((section) => {
    if (section.heading === "Root Cause") {
      return { ...section, body: sections.rootCause, source: "ai" as const };
    }
    if (
      section.heading === "Preventive Measures" &&
      sections.preventiveMeasures &&
      isNarrativeTextSufficient(data.preventiveMeasures)
    ) {
      return { ...section, body: sections.preventiveMeasures, source: "ai" as const };
    }
    return section;
  });

  return {
    ...draft,
    sections: nextSections,
    metadata: { ...draft.metadata, aiDrafted: true },
  };
}

export const __test = { buildUserPrompt, REJECT_PATTERNS, DraftSectionsSchema };
