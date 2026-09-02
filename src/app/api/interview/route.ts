import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createCaseFile, nextStep, applyAnswer, interviewProgress } from "@/core/interviewEngine";
import type { CaseFile, StepAnswer } from "@/core/interviewEngine";
import type { ViolationKind } from "@/core";

const MAX_CASEFILE_BYTES = 200_000;

export const dynamic = "force-dynamic";

function isViolationKind(value: unknown): value is ViolationKind {
  return (
    typeof value === "string" &&
    [
      "INAUTHENTIC_DOCUMENTS",
      "RELATED_ACCOUNT",
      "POLICY",
      "INTELLECTUAL_PROPERTY",
      "LISTING",
      "FUNDS",
      "UNKNOWN",
    ].includes(value)
  );
}

function sanitizeCaseFile(input: unknown): CaseFile | null {
  if (!input || typeof input !== "object") return null;
  const c = input as Record<string, unknown>;
  if (!isViolationKind(c.kind)) return null;
  if (typeof c.state !== "string") return null;
  if (!Array.isArray(c.timelineEvents)) return null;
  if (typeof c.priorAppealCount !== "number") return null;
  if (!c.evidenceSlots || typeof c.evidenceSlots !== "object") return null;
  if (!Array.isArray(c.actionItems)) return null;
  if (typeof c.attemptCount !== "number") return null;
  return c as unknown as CaseFile;
}

function sanitizeAnswer(input: unknown): StepAnswer | null {
  if (!input || typeof input !== "object") return null;
  const a = input as Record<string, unknown>;
  if (typeof a.stepId !== "string") return null;
  if (a.stepId.length > 64) return null;
  if (a.value !== undefined && typeof a.value !== "string") return null;
  if (a.value && a.value.length > 2000) return null;
  if (a.choiceId !== undefined && typeof a.choiceId !== "string") return null;
  if (a.choiceId && a.choiceId.length > 64) return null;
  if (a.filePresent !== undefined && typeof a.filePresent !== "boolean") return null;
  if (a.declined !== undefined && typeof a.declined !== "boolean") return null;
  if (a.declineReason !== undefined && typeof a.declineReason !== "string") return null;
  if (a.declineReason && a.declineReason.length > 500) return null;
  if (a.declineAlternativeId !== undefined && typeof a.declineAlternativeId !== "string")
    return null;
  if (a.declineAlternativeId && a.declineAlternativeId.length > 64) return null;
  return {
    stepId: a.stepId,
    value: a.value,
    choiceId: a.choiceId,
    filePresent: a.filePresent,
    declined: a.declined,
    declineReason: a.declineReason,
    declineAlternativeId: a.declineAlternativeId,
  };
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const {
    action,
    caseFile: rawCaseFile,
    answer: rawAnswer,
    kind,
  } = body as Record<string, unknown>;

  const payload = JSON.stringify({ action, caseFile: rawCaseFile, answer: rawAnswer, kind });
  if (payload.length > MAX_CASEFILE_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  if (action === "start") {
    if (!isViolationKind(kind)) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }
    const file = createCaseFile(kind);
    const step = nextStep(file);
    const progress = interviewProgress(file);
    return NextResponse.json({ caseFile: file, step, progress, complete: !step });
  }

  if (action === "answer") {
    const caseFile = sanitizeCaseFile(rawCaseFile);
    const answer = sanitizeAnswer(rawAnswer);
    if (!caseFile || !answer) {
      return NextResponse.json({ error: "Invalid caseFile or answer" }, { status: 400 });
    }
    const updated = applyAnswer(caseFile, answer);
    const step = nextStep(updated);
    const progress = interviewProgress(updated);
    return NextResponse.json({ caseFile: updated, step, progress, complete: !step });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
