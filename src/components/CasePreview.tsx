import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP } from "@/content/app";
import { requirementsFor } from "@/core/evidenceModel";
import type { EvidenceKind } from "@/core/evidenceModel";
import type { ViolationKind } from "@/core";
import { nextBestActions } from "@/core/caseState";

interface CasePreviewProps {
  kind: ViolationKind;
}

export function CasePreview({ kind }: CasePreviewProps) {
  const reqs = requirementsFor(kind);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {APP.access.casePreview.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium">{APP.access.casePreview.evidenceTitle}</h4>
          <ul className="space-y-2">
            {reqs.map((r) => (
              <li key={r.kind} className="flex items-start gap-2">
                <Badge variant={r.required ? "default" : "outline"} className="mt-0.5">
                  {r.required ? APP.access.casePreview.required : APP.access.casePreview.optional}
                </Badge>
                <span className="text-sm">{evidenceKindLabel(r.kind)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium">{APP.access.casePreview.actionsTitle}</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {nextBestActions("DECODED").map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">{APP.access.casePreview.startNote}</p>
      </CardContent>
    </Card>
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
