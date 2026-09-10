"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CaseStateBadge } from "@/components/CaseStateBadge";
import { DeadlineChipList } from "@/components/DeadlineChip";
import { LocalFirstBadge } from "@/components/LocalFirstBadge";
import { guidanceFor } from "@/core/guidance";
import { HOME, DECODE } from "@/content/marketing";
import type { Deadline } from "@/core";

const ARTIFACT_TODAY = new Date("2026-09-05T00:00:00Z");

const HERO_DEADLINES: Deadline[] = [
  {
    kind: "appeal_window",
    dueAt: new Date("2026-09-22T23:59:59Z"),
    label: "Appeal window",
  },
  {
    kind: "funds_appeal_eligible",
    dueAt: new Date("2026-11-04T23:59:59Z"),
    label: "Funds appeal becomes available",
  },
];

export function HeroArtifact() {
  const guidance = guidanceFor("POLICY");
  const doNowItems = guidance.triage.doNow.slice(0, 2);

  return (
    <div aria-hidden="true" role="presentation" className="relative">
      <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-primary/10 blur-3xl" />
      <Card className="overflow-hidden rounded-xl shadow-elevated">
        <div className="flex items-center justify-between border-b border-border/80 bg-surface-2/60 px-5 py-3">
          <span className="text-eyebrow uppercase text-muted-foreground">
            {HOME.hero.artwork.label}
          </span>
          <LocalFirstBadge />
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <SeverityBadge severity="low" />
            <CaseStateBadge kind="POLICY" />
          </div>
          <p className="text-sm leading-relaxed text-foreground">{guidance.summary}</p>
          <DeadlineChipList deadlines={HERO_DEADLINES} now={ARTIFACT_TODAY} />
          <div className="rounded-md border border-border/70 bg-surface-2 p-4">
            <p className="text-eyebrow uppercase text-muted-foreground">{DECODE.result.doNow}</p>
            <ul className="mt-2 space-y-1.5">
              {doNowItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
      <p className="sr-only">{HOME.hero.artwork.srOnly}</p>
    </div>
  );
}
