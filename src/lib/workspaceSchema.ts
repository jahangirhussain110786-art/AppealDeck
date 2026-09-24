import { z } from "zod";
import { PROTOCOLS, EVIDENCE_KINDS } from "@/core/workspace";
import { VIOLATION_KINDS } from "@/core/violationKinds";

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
  status: z.enum(["needed", "waiting", "reviewed", "cannot_obtain"]),
  note: z.string().max(4000),
  recordId: id.optional(),
  filename: z.string().min(1).max(500).optional(),
  contentHash: z.string().min(1).max(200).optional(),
  page: z.number().int().min(1).max(10000).optional(),
  // A-02: this validator strips keys it does not know, so a field added to `Requirement` and not
  // added here is silently dropped on the way to the vault. That has already happened twice in
  // this codebase (#91's `source`/`issues`), and a dropped decline would turn "I told you I can't
  // get this" back into an unexplained blank the next time the case is opened.
  declined: z
    .object({
      reason: z.string().min(1).max(1000),
      alternativeId: z.string().max(100).optional(),
      at: z.string().min(1).max(40),
    })
    .optional(),
  // B-05: without this the validator strips `source`, every matrix-inferred requirement comes back
  // looking like one Amazon named, and `workspaceGaps` then demands a quote from the notice that
  // was never there. The seller would see "check the source of the request" for a record we raised.
  source: z.enum(["notice", "matrix", "seller"]).optional(),
  // Added with `source`'s third member, and for the same reason: dropped here, a carried
  // requirement loses the revision its quote belongs to on the next save, and the reply-round
  // regression this fix removes comes straight back the first time the workspace round-trips.
  sourceRevision: z.number().int().min(1).max(999).optional(),
  // J: the typed evidence kind. Stripped here, a requirement loses its identity on the first save
  // and falls back to matching its label — which is the exact fragility the field replaces, and
  // would quietly reinstate the duplicate-on-kind-change bug for any renamed record.
  evidenceKind: z.enum(EVIDENCE_KINDS).optional(),
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
    /**
     * #86. Derived from `VIOLATION_KINDS` so a new kind is accepted the moment core defines it,
     * rather than being rejected by a validator nobody remembered to update. Optional because a
     * case saved before this shipped has neither field.
     */
    issues: z
      .array(
        z.object({
          kind: z.enum(VIOLATION_KINDS),
          sourceQuote: z.string().max(2000),
        }),
      )
      .max(VIOLATION_KINDS.length)
      .optional(),
    issuesConfirmed: z.boolean().optional(),
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
    // A-01: added here in the same edit as the field itself. This validator strips what it does
    // not know, and an attestation dropped on the way to the vault would leave the critic warning
    // about claims the seller had in fact stood behind.
    correctiveActionsAttested: z.object({ at: z.string().min(1).max(40) }).optional(),
    preventiveMeasures: text,
    history: z
      .array(z.object({ id, at: z.string().datetime(), message: z.string().max(2000) }))
      .max(200),
    submissions: z
      .array(
        z.object({
          id,
          at: z.string().datetime(),
          /**
           * #91: `0` is a response the seller sent before this case existed, so it predates the
           * workspace's own first revision. Without the lower bound moving, recording one would
           * be rejected by the validator that guards every vault write.
           */
          revision: z.number().int().min(0).max(999),
          protocol,
          text: z.string().max(60000),
          receipt: z.string().max(2000),
          attachments: z.array(attachment).max(30),
          /**
           * Must be declared: this schema strips keys it does not know, so leaving it out would
           * drop the marker on the first save and the attempt would come back looking like one
           * drafted here.
           */
          source: z.literal("prior").optional(),
          // Both declared for the same reason: stripped here, a seller's edited submission would
          // come back as though the prepared text had been sent, and its open items would vanish.
          preparedText: z.string().max(60000).optional(),
          unresolved: z.array(z.string().max(2000)).max(50).optional(),
          readinessAtSubmit: z.number().int().min(0).max(100).optional(),
        }),
      )
      .max(99),
    // Declared because this schema strips unknown keys: without it, every questionnaire answer a
    // seller saved would be discarded on the way into the vault.
    answers: z
      .array(z.object({ question: z.string().max(500), answer: z.string().max(12000) }))
      .max(50)
      .optional(),
    // Same reason: stripped here, a removed record would come back on the next confirmation.
    dismissed: z
      .array(
        z.object({
          key: z.string().max(200),
          label: z.string().max(200),
          reason: z.string().max(2000),
          at: z.string().datetime(),
        }),
      )
      .max(100)
      .optional(),
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
