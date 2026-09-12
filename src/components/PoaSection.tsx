"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/CopyButton";
import { SeverityBadge } from "@/components/SeverityBadge";
import { badgeSeverity, worstSeverity } from "@/lib/findingSections";
import type { PoaSection as CorePoaSection, CriticFinding } from "@/core";
import { APP } from "@/content/app";

type FixCode = keyof typeof APP.compose.findingFix;

/** One-line fix from content, keyed by finding code; falls back to the engine's message. */
function fixLineFor(finding: CriticFinding): string {
  return APP.compose.findingFix[finding.code as FixCode] ?? finding.message;
}

interface PoaSectionProps {
  section: CorePoaSection;
  index: number;
  findings: CriticFinding[];
  draftText: string;
  onEdit: (index: number, text: string) => void;
  readOnly?: boolean;
  /**
   * True when this section's body is the seller's own narrative (verbatim or AI-drafted from it)
   * rather than a system-generated gap message or a structured list (Corrective Actions, Evidence
   * Gaps). Controls whether the provenance badge renders at all — showing "Your own words" on a
   * "there isn't enough detail yet" gap message would be misleading.
   */
  isSellerNarrative?: boolean;
}

function ProvenanceBadge({ source }: { source: CorePoaSection["source"] }) {
  const copy = source === "ai" ? APP.compose.aiDrafted : APP.compose.sellerWords;
  return (
    <Badge
      variant={source === "ai" ? "info" : "secondary"}
      title={copy.detail}
      className="font-normal"
    >
      {copy.badge}
    </Badge>
  );
}

function FindingNotes({
  findings,
  label,
  className,
}: {
  findings: CriticFinding[];
  label?: string;
  className?: string;
}) {
  return (
    <ul role="list" aria-label={label} className={cn("flex flex-col gap-3", className)}>
      {findings.map((finding, i) => (
        <li key={`${finding.code}-${i}`} className="flex flex-col gap-1">
          <SeverityBadge severity={badgeSeverity(finding.severity)} className="w-fit" />
          <p className="text-xs text-muted-foreground">{fixLineFor(finding)}</p>
          <span className="sr-only">{finding.message}</span>
        </li>
      ))}
    </ul>
  );
}

export function PoaSection({
  section,
  index,
  findings,
  draftText,
  onEdit,
  readOnly = false,
  isSellerNarrative = false,
}: PoaSectionProps) {
  const showNotes = !readOnly && findings.length > 0;
  const notesLabel = `${APP.compose.critic.asideLabel}: ${section.heading}`;

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-4 space-y-0 pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <span>{section.heading}</span>
          {findings.length > 0 && <SeverityBadge severity={worstSeverity(findings)} />}
          {isSellerNarrative && <ProvenanceBadge source={section.source} />}
        </CardTitle>
        <CopyButton
          text={readOnly ? section.body : draftText}
          label={APP.compose.critic.copySection.replace("{heading}", section.heading)}
        />
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          {readOnly ? (
            <pre className="flex-1 whitespace-pre-wrap rounded border border-border bg-muted/20 p-3 font-mono text-sm text-foreground">
              {section.body}
            </pre>
          ) : (
            <Textarea
              value={draftText}
              onChange={(e) => onEdit(index, e.target.value)}
              spellCheck
              aria-label={section.heading}
              className="font-mono text-sm"
              rows={Math.min(8, 3 + Math.ceil(section.body.length / 80))}
            />
          )}
          {showNotes && (
            <aside
              aria-label={notesLabel}
              className="hidden w-60 shrink-0 rounded-md border border-border/70 bg-surface-2 p-3 md:block"
            >
              <FindingNotes findings={findings} />
            </aside>
          )}
        </div>
        {showNotes && (
          <FindingNotes findings={findings} label={notesLabel} className="mt-3 md:hidden" />
        )}
      </CardContent>
    </Card>
  );
}

export function PoaFindingsList({ findings }: { findings: CriticFinding[] }) {
  if (findings.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{APP.compose.critic.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul role="list" className="space-y-2">
          {findings.map((finding, i) => {
            const fix = fixLineFor(finding);
            return (
              <li
                key={`${finding.code}-${i}`}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-sm",
                  finding.severity === "error" &&
                    "border-destructive/40 bg-destructive/5 text-destructive",
                  finding.severity === "warning" && "border-warning/40 bg-warning/5 text-warning",
                  finding.severity === "info" && "border-border bg-muted/30 text-muted-foreground",
                )}
              >
                <SeverityBadge
                  severity={badgeSeverity(finding.severity)}
                  className="mt-0.5 shrink-0"
                />
                <div className="space-y-1">
                  <span className="font-mono text-xs uppercase">{finding.code}</span>
                  <p>{finding.message}</p>
                  {fix !== finding.message && (
                    <p className="text-xs text-muted-foreground">{fix}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
