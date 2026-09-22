import { z } from "zod";
import { PROTOCOLS } from "@/core/workspace";

const id = z.string().min(1).max(100);
const text = z.string().max(12000);
const noticeText = z.string().max(50000);
// Derived from core's PROTOCOL_LABELS (AA-39) so a new protocol is accepted here automatically.
const protocol = z.enum(PROTOCOLS);
const attachment = z.object({
  recordId: id,
  filename: z.string().min(1).max(500),
  contentHash: z.string().min(1).max(200),
  page: z.number().int().min(1).max(10000),
});
const requirement = z.object({
  id,
  label: z.string().min(1).max(500),
  sourceQuote: z.string().min(1).max(2000),
  status: z.enum(["needed", "waiting", "reviewed"]),
  note: z.string().max(4000),
  recordId: id.optional(),
  filename: z.string().min(1).max(500).optional(),
  contentHash: z.string().min(1).max(200).optional(),
  page: z.number().int().min(1).max(10000).optional(),
});
export const WorkspaceSchema = z
  .object({
    version: z.literal(1),
    revision: z.number().int().min(1).max(999),
    marketplace: z.enum(["US", "other"]),
    notice: noticeText,
    decodedNoticeHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    formInstructions: text,
    position: z.enum(["unsure", "accept", "dispute"]),
    protocol,
    confirmed: z.boolean(),
    professionalReviewRequired: z.boolean(),
    requirementsConfirmed: z.boolean(),
    requirements: z.array(requirement).max(30),
    previousRequests: z
      .array(
        z.object({
          revision: z.number().int().min(1).max(999),
          notice: noticeText,
          formInstructions: text,
          protocol,
          requirements: z.array(requirement).max(30),
        }),
      )
      .max(99),
    explanation: text,
    correctiveActions: text,
    preventiveMeasures: text,
    history: z
      .array(z.object({ id, at: z.string().datetime(), message: z.string().max(2000) }))
      .max(200),
    submissions: z
      .array(
        z.object({
          id,
          at: z.string().datetime(),
          revision: z.number().int().min(1).max(999),
          protocol,
          text: z.string().max(60000),
          receipt: z.string().max(2000),
          attachments: z.array(attachment).max(30),
        }),
      )
      .max(99),
    replies: z
      .array(z.object({ id, at: z.string().datetime(), text, applied: z.boolean() }))
      .max(99),
    draft: z.record(z.string().max(200), z.string().max(50000)).optional(),
  })
  .superRefine((w, ctx) => {
    for (const key of ["requirements", "submissions", "replies"] as const) {
      if (new Set(w[key].map((r) => r.id)).size !== w[key].length)
        ctx.addIssue({ code: "custom", path: [key], message: "Duplicate record identifiers." });
    }
    if (w.draft && Object.keys(w.draft).length > 20)
      ctx.addIssue({ code: "custom", path: ["draft"], message: "Too many unsaved draft fields." });
  });
