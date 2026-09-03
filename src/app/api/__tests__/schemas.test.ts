import { describe, expect, it } from "vitest";
import { z } from "zod";

const DecodeBody = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Field 'text' is required.")
    .max(50_000, "Notice text exceeds 50,000 character limit."),
});

const AnalyzeReplyBody = z.object({
  reply: z
    .string()
    .trim()
    .min(1, "Field 'reply' is required.")
    .max(30_000, "Reply text exceeds 30,000 character limit."),
});

const ViolationKinds = [
  "INAUTHENTIC_DOCUMENTS",
  "RELATED_ACCOUNT",
  "POLICY",
  "INTELLECTUAL_PROPERTY",
  "LISTING",
  "FUNDS",
  "UNKNOWN",
] as const;

const StartBody = z.object({
  action: z.literal("start"),
  kind: z.enum(ViolationKinds),
});

const AnswerBody = z.object({
  action: z.literal("answer"),
  caseFile: z.object({
    kind: z.enum(ViolationKinds),
    state: z.string(),
    timelineEvents: z.array(z.object({ date: z.string(), description: z.string() })),
    priorAppealCount: z.number().int().nonnegative(),
    evidenceSlots: z.record(z.string(), z.object({ present: z.boolean().optional() })),
    actionItems: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        status: z.enum(["todo", "in_progress", "done"]),
      }),
    ),
    attemptCount: z.number().int().nonnegative(),
  }),
  answer: z.object({
    stepId: z.string().max(64),
    value: z.string().max(2_000).optional(),
  }),
});

const InterviewBody = z.discriminatedUnion("action", [StartBody, AnswerBody]);

describe("API body Zod schemas", () => {
  describe("DecodeBody", () => {
    it("accepts non-empty text", () => {
      const r = DecodeBody.safeParse({ text: "Amazon notice text" });
      expect(r.success).toBe(true);
    });
    it("rejects empty text", () => {
      const r = DecodeBody.safeParse({ text: "   " });
      expect(r.success).toBe(false);
    });
    it("rejects missing text", () => {
      const r = DecodeBody.safeParse({});
      expect(r.success).toBe(false);
    });
    it("rejects >50k text", () => {
      const r = DecodeBody.safeParse({ text: "a".repeat(50_001) });
      expect(r.success).toBe(false);
    });
  });

  describe("AnalyzeReplyBody", () => {
    it("accepts non-empty reply", () => {
      const r = AnalyzeReplyBody.safeParse({ reply: "hi" });
      expect(r.success).toBe(true);
    });
    it("rejects >30k reply", () => {
      const r = AnalyzeReplyBody.safeParse({ reply: "a".repeat(30_001) });
      expect(r.success).toBe(false);
    });
  });

  describe("InterviewBody (discriminated union)", () => {
    it("accepts start + valid kind", () => {
      const r = InterviewBody.safeParse({ action: "start", kind: "POLICY" });
      expect(r.success).toBe(true);
    });
    it("rejects start with bad kind", () => {
      const r = InterviewBody.safeParse({ action: "start", kind: "BOGUS" });
      expect(r.success).toBe(false);
    });
    it("accepts answer with full caseFile", () => {
      const r = InterviewBody.safeParse({
        action: "answer",
        caseFile: {
          kind: "POLICY",
          state: "open",
          timelineEvents: [],
          priorAppealCount: 0,
          evidenceSlots: {},
          actionItems: [],
          attemptCount: 1,
        },
        answer: { stepId: "step_1" },
      });
      expect(r.success).toBe(true);
    });
    it("rejects answer with stepId >64 chars", () => {
      const r = InterviewBody.safeParse({
        action: "answer",
        caseFile: {
          kind: "POLICY",
          state: "open",
          timelineEvents: [],
          priorAppealCount: 0,
          evidenceSlots: {},
          actionItems: [],
          attemptCount: 1,
        },
        answer: { stepId: "a".repeat(65) },
      });
      expect(r.success).toBe(false);
    });
    it("rejects unknown action", () => {
      const r = InterviewBody.safeParse({ action: "blow_up" });
      expect(r.success).toBe(false);
    });
  });
});
