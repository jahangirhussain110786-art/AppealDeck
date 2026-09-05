"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/CopyButton";
import { SeverityBadge } from "@/components/SeverityBadge";
import type { PoaSection as CorePoaSection, CriticFinding } from "@/core/composer";

interface PoaSectionProps {
  section: CorePoaSection;
  index: number;
  findings: CriticFinding[];
  draftText: string;
  onEdit: (index: number, text: string) => void;
  readOnly?: boolean;
}

export function PoaSection({
  section,
  index,
  findings,
  draftText,
  onEdit,
  readOnly = false,
}: PoaSectionProps) {
  const sectionFindings = findings.filter((f) => {
    const lowerMsg = f.message.toLowerCase();
    if (section.heading.toLowerCase().includes("root cause") && lowerMsg.includes("root"))
      return true;
    if (section.heading.toLowerCase().includes("corrective") && lowerMsg.includes("corrective"))
      return true;
    if (section.heading.toLowerCase().includes("preventive") && lowerMsg.includes("preventive"))
      return true;
    if (section.heading.toLowerCase().includes("evidence") && lowerMsg.includes("evidence"))
      return true;
    return false;
  });

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>{section.heading}</span>
          {sectionFindings.length > 0 && (
            <SeverityBadge
              severity={sectionFindings.some((f) => f.severity === "error") ? "high" : "medium"}
            />
          )}
        </CardTitle>
        <CopyButton text={section.body} label={`Copy ${section.heading}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          {!readOnly && sectionFindings.length > 0 && (
            <div className="mt-0.5 flex flex-col items-center gap-1">
              {sectionFindings.map((f, fi) => (
                <div key={fi} className="flex flex-col items-center">
                  <AlertCircle
                    className={cn(
                      "h-3.5 w-3.5",
                      f.severity === "error"
                        ? "text-destructive"
                        : f.severity === "warning"
                          ? "text-warning"
                          : "text-info",
                    )}
                    aria-label={`Finding: ${f.code}`}
                  />
                  <span className="sr-only">{f.message}</span>
                </div>
              ))}
            </div>
          )}
          {readOnly ? (
            <pre className="flex-1 whitespace-pre-wrap rounded border border-border bg-muted/20 p-3 font-mono text-sm text-foreground">
              {section.body}
            </pre>
          ) : (
            <Textarea
              value={draftText}
              onChange={(e) => onEdit(index, e.target.value)}
              className="font-mono text-sm"
              rows={Math.min(8, 3 + Math.ceil(section.body.length / 80))}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PoaFindingsList({ findings }: { findings: CriticFinding[] }) {
  if (findings.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Critic review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {findings.map((f, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-2 rounded-lg border p-3 text-sm",
              f.severity === "error" && "border-destructive/40 bg-destructive/5 text-destructive",
              f.severity === "warning" && "border-warning/40 bg-warning/5 text-warning",
              f.severity === "info" && "border-border bg-muted/30 text-muted-foreground",
            )}
          >
            {f.severity === "error" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div>
              <span className="font-mono text-xs uppercase">{f.code}</span>
              <p>{f.message}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
