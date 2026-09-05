import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorizedJsonResponse } from "@/lib/auth";
import { isLicenseActive } from "@/lib/license";
import { createCaseFile, nextStep, applyAnswer, interviewProgress } from "@/core/interviewEngine";
import type { CaseFile, StepAnswer } from "@/core/interviewEngine";
import type { ViolationKind } from "@/core";
import { rateLimitInterview, tooManyRequestsResponse } from "@/lib/ratelimit";

const MAX_CASEFILE_BYTES = 200_000;

export const dynamic = "force-dynamic";

const ViolationKinds = [
  "INAUTHENTIC_DOCUMENTS",
  "RELATED_ACCOUNT",
  "POLICY",
  "INTELLECTUAL_PROPERTY",
  "LISTING",
  "FUNDS",
  "UNKNOWN",
] as const;

const TimelineEvent = z.object({
  date: z.string(),
  description: z.string(),
});

const EvidenceSlot = z.object({
  present: z.boolean().optional(),
  disqualified: z.boolean().optional(),
  vaultRecordId: z.string().optional(),
});

const ActionItem = z.object({
  id: z.string(),
  label: z.string(),
  evidenceSlots: z.array(z.string()).optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  declined: z
    .object({
      reason: z.string(),
      at: z.string(),
    })
    .optional(),
});

const CaseFileSchema = z.object({
  kind: z.enum(ViolationKinds),
  state: z.string(),
  rootCause: z.string().optional(),
  timelineEvents: z.array(TimelineEvent),
  priorAppealCount: z.number().int().nonnegative(),
  evidenceSlots: z.record(z.string(), EvidenceSlot),
  actionItems: z.array(ActionItem),
  attemptCount: z.number().int().nonnegative(),
});

const AnswerSchema = z.object({
  stepId: z.string().max(64),
  value: z.string().max(2_000).optional(),
  choiceId: z.string().max(64).optional(),
  filePresent: z.boolean().optional(),
  declined: z.boolean().optional(),
  declineReason: z.string().max(500).optional(),
  declineAlternativeId: z.string().max(64).optional(),
});

const StartBody = z.object({
  action: z.literal("start"),
  kind: z.enum(ViolationKinds),
});

const AnswerBody = z.object({
  action: z.literal("answer"),
  caseFile: CaseFileSchema,
  answer: AnswerSchema,
});

const InterviewBody = z.discriminatedUnion("action", [StartBody, AnswerBody]);

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return unauthorizedJsonResponse();
  }

  if (!(await isLicenseActive(user.email))) {
    return NextResponse.json({ error: "Appeal Pass required." }, { status: 403 });
  }

  const rate = await rateLimitInterview(user);
  if (!rate.success) {
    return tooManyRequestsResponse(rate);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payloadBytes = JSON.stringify(body ?? {}).length;
  if (payloadBytes > MAX_CASEFILE_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const parsed = InterviewBody.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid body";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  if (parsed.data.action === "start") {
    const { kind } = parsed.data;
    const file = createCaseFile(kind);
    const step = nextStep(file);
    const progress = interviewProgress(file);
    return NextResponse.json({ caseFile: file, step, progress, complete: !step });
  }

  const { caseFile, answer } = parsed.data;
  const updated = applyAnswer(caseFile as unknown as CaseFile, answer as StepAnswer);
  const step = nextStep(updated);
  const progress = interviewProgress(updated);
  return NextResponse.json({ caseFile: updated, step, progress, complete: !step });
}
