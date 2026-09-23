import { z } from "zod";
import { VIOLATION_KINDS } from "@/core/violationKinds";
import { WorkspaceSchema } from "./workspaceSchema";

// Derived from core's VIOLATION_KINDS so a new taxonomy member cannot be accepted by the type
// system while being rejected at the schema boundary (AA-39).
export const ViolationKindSchema = z.enum(VIOLATION_KINDS);
export const CaseIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const EvidenceKindSchema = z.enum([
  "supplier_invoice",
  "brand_authorization",
  "rights_owner_retraction",
  "identity_doc",
  "financial_instrument_doc",
  "sourcing_doc",
  "listing_fix_proof",
  "disposal_or_recall_proof",
  "metric_export",
  "sop_document",
  "other",
]);
const narrative = z.string().max(12000);
export const CaseDataSchema = z.object({
  workspace: WorkspaceSchema.optional(),
  id: CaseIdSchema,
  kind: ViolationKindSchema,
  // Stripped here, a seller's correction would look like our own classification the next time a
  // case passed through this schema — and the next confirmation would overwrite it.
  kindSetBy: z.literal("seller").optional(),
  createdAt: z.string().datetime().optional(),
  state: z
    .enum([
      "DECODED",
      "GATED_PRO_HELP",
      "INTAKE",
      "REMEDIATION",
      "READY",
      "SUBMITTED",
      "AWAITING",
      "APPROVED",
      "REJECTED",
      "REVISION",
      "NO_RESPONSE",
      "FOLLOW_UP",
      "ESCALATION",
      "CLOSED",
    ])
    .default("DECODED"),
  rootCause: narrative.optional(),
  preventiveMeasures: narrative.optional(),
  preventiveMeasuresAsked: z.boolean().optional(),
  priorAppealsAnswered: z.boolean().optional(),
  timelineEvents: z
    .array(z.object({ date: z.string().max(40), description: z.string().max(2000) }))
    .max(100)
    .default([]),
  priorAppealCount: z.number().int().min(0).max(99).default(0),
  attemptCount: z.number().int().min(0).max(99).default(0),
  evidenceSlots: z
    .partialRecord(
      EvidenceKindSchema,
      z.object({
        present: z.boolean(),
        disqualified: z.boolean().optional(),
        documentDate: z.string().max(40).optional(),
        vaultRecordId: z.string().max(100).optional(),
      }),
    )
    .default({}),
  actionItems: z
    .array(
      z.object({
        id: z.string().max(100),
        label: z.string().max(2000),
        evidenceSlots: z.array(EvidenceKindSchema).max(20).default([]),
        status: z.enum(["todo", "in_progress", "done"]),
        declined: z.object({ reason: z.string().max(2000), at: z.string().max(40) }).optional(),
        attestation: z
          .object({ attestedAt: z.string().max(40), note: z.string().max(2000) })
          .optional(),
        actionCheckAnswer: z.enum(["done", "will_do"]).optional(),
      }),
    )
    .max(100)
    .default([]),
  deadlines: z
    .array(
      z.object({
        kind: z.enum([
          "appeal_window",
          "funds_appeal_eligible",
          "funds_review",
          "seller_challenge",
          "aha_72h",
          "indefinite_hold",
          "custom",
        ]),
        dueAt: z.string().datetime().nullable(),
        label: z.string().max(1000),
        isIndefinite: z.boolean().optional(),
      }),
    )
    .max(20)
    .optional(),
});
