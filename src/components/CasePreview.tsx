import { Check, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EvidenceStatusBadge } from "@/components/EvidenceStatusBadge";
import { APP } from "@/content/app";
import { requirementsFor } from "@/core/evidenceModel";
import type { EvidenceKind } from "@/core/evidenceModel";
import type { ViolationKind } from "@/core";
import { nextBestActions } from "@/core/caseState";
import type { CaseFile } from "@/core/interviewEngine";

interface CasePreviewProps {
  kind: ViolationKind;
  caseFile?: CaseFile;
}

export function CasePreview({ kind, caseFile }: CasePreviewProps) {
  const reqs = requirementsFor(kind);
  const state = caseFile?.state ?? "DECODED";

  return (
    <div className="rounded-lg border border-border/80 bg-surface-2 p-5">
      <p className="text-eyebrow uppercase text-muted-foreground">{APP.access.casePreview.title}</p>

      <div className="mt-4">
        <p className="text-eyebrow uppercase text-muted-foreground">
          {APP.access.casePreview.evidenceTitle}
        </p>
        <ul className="mt-2 space-y-2">
          {reqs.map((r) => {
            const present = caseFile?.evidenceSlots[r.kind]?.present === true;
            return (
              <li key={r.kind} className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 text-sm">
                  {r.required ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <Minus className="mt-0.5 size-4 shrink-0 text-muted-foreground/70" />
                  )}
                  <span>{evidenceKindLabel(r.kind)}</span>
                  <Badge variant="secondary" size="sm">
                    {r.required ? APP.access.casePreview.required : APP.access.casePreview.optional}
                  </Badge>
                </div>
                <EvidenceStatusBadge
                  status={present ? "present" : "pending"}
                  className="mt-0.5 shrink-0"
                />
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5">
        <p className="text-eyebrow uppercase text-muted-foreground">
          {APP.access.casePreview.actionsTitle}
        </p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {nextBestActions(state).map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">{APP.access.casePreview.startNote}</p>
    </div>
  );
}

function evidenceKindLabel(kind: EvidenceKind): string {
  const labels: Record<EvidenceKind, string> = {
    supplier_invoice: "Supplier invoice",
    brand_authorization: "Brand authorization",
    rights_owner_retraction: "Rights owner retraction",
    identity_doc: "Identity document",
    financial_instrument_doc: "Financial instrument document",
    sourcing_doc: "Sourcing document",
    listing_fix_proof: "Listing fix proof",
    disposal_or_recall_proof: "Disposal/recall proof",
    metric_export: "Metric export",
    sop_document: "SOP document",
    other: "Other",
  };
  return labels[kind];
}
