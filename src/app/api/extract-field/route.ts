import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { callGemini, withGeminiBreaker } from "@/lib/llm/gemini";

export const dynamic = "force-dynamic";

const ExtractFieldBody = z.object({
  stepId: z.string().min(1).max(64),
  text: z.string().min(1).max(2_000, "Text exceeds 2,000 character limit."),
});

const ExtractFieldSuggestions = z.object({
  suggestedKind: z
    .enum([
      "INAUTHENTIC_DOCUMENTS",
      "RELATED_ACCOUNT",
      "POLICY",
      "INTELLECTUAL_PROPERTY",
      "LISTING",
      "FUNDS",
      "UNKNOWN",
    ])
    .optional(),
  suggestedSeverity: z.enum(["low", "medium", "high", "critical"]).optional(),
  suggestedTimelineSummary: z.string().max(280).optional(),
});

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    suggestedKind: {
      type: "string",
      enum: [
        "INAUTHENTIC_DOCUMENTS",
        "RELATED_ACCOUNT",
        "POLICY",
        "INTELLECTUAL_PROPERTY",
        "LISTING",
        "FUNDS",
        "UNKNOWN",
      ],
    },
    suggestedSeverity: {
      type: "string",
      enum: ["low", "medium", "high", "critical"],
    },
    suggestedTimelineSummary: { type: "string" },
  },
} as const;

const SYSTEM_PROMPT = `You extract structured hints from a free-text description of an Amazon seller account issue. Every field is optional. Keep suggestedTimelineSummary to one sentence, max 280 chars. Do not invent facts that the seller did not say. If the text does not clearly indicate a field, omit it.`;

const USER_PROMPT_TEMPLATE = (text: string) =>
  `Seller wrote:\n---\n${text}\n---\nReturn JSON only.`;

export type ExtractFieldDeps = {
  callGemini: typeof callGemini;
};

export async function handleExtractField(
  req: NextRequest,
  deps: ExtractFieldDeps = { callGemini },
): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = ExtractFieldBody.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid body.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const result = await deps.callGemini({
    messages: [
      { role: "system", text: SYSTEM_PROMPT },
      { role: "user", text: USER_PROMPT_TEMPLATE(parsed.data.text) },
    ],
    temperature: 0.1,
    maxOutputTokens: 256,
    responseJsonSchema: RESPONSE_JSON_SCHEMA,
  });

  if (!result.ok) {
    if (result.reason === "not_configured") {
      return NextResponse.json(
        { ok: false, reason: "rules_only", message: "Cloud extraction is disabled." },
        { status: 200 },
      );
    }
    return NextResponse.json(
      { ok: false, reason: "rules_only", message: result.message },
      { status: 200 },
    );
  }

  const raw = result.text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    return NextResponse.json(
      { ok: false, reason: "rules_only", message: "Cloud did not return JSON." },
      { status: 200 },
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  } catch {
    return NextResponse.json(
      { ok: false, reason: "rules_only", message: "Cloud returned malformed JSON." },
      { status: 200 },
    );
  }

  const validated = ExtractFieldSuggestions.safeParse(parsedJson);
  if (!validated.success) {
    return NextResponse.json(
      { ok: false, reason: "rules_only", message: "Cloud JSON did not match schema." },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true, suggestions: validated.data });
}

export const POST = withGeminiBreaker(async (req: NextRequest) => {
  await requireUser();
  return handleExtractField(req);
});
