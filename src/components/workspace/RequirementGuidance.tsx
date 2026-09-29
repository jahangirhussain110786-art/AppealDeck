"use client";
import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CopyButton } from "@/components/CopyButton";
import { DetailDisclosure } from "./WorkspaceVisuals";
import type { RequirementGuidance } from "@/core/requirementGuidance";
import type { Requirement } from "@/core/workspace";
import { WORKSPACE as C } from "@/content/workspace";

/**
 * "What is this record, why do they want it, how do I ask for it, and what if I can't?"
 *
 * Its four parts — the matrix sentence (A-05), the disqualifiers, the outreach letters (A-06) and
 * the objection path (A-02/A-03) — were each built, tested, ticked off as delivered, and reachable
 * by no seller until 23 Sep 2026. The calm pass (29 Sep 2026) split the one block into these parts
 * so each can sit where a seller looks for it: the reason in view, the standards behind "What a
 * good … shows", and the letters and the objection path behind "I don't have it". Nothing in any
 * part was dropped.
 *
 * The objection path is the one that matters most. Before it, a seller who could not obtain a
 * compliant supplier invoice — the most common dead end in the product — had no way to say so, and
 * stayed blocked on a gap they could never clear. AM-17 called answering that objection the moment
 * agencies earn their fee.
 *
 * A hand-added requirement matches no evidence kind and has nothing behind it, so the caller
 * passes no guidance and each part renders nothing. Inventing guidance would be the dishonest answer.
 */

/** The one honest sentence explaining why Amazon asks. */
export function GuidanceWhy({ guidance }: { guidance: RequirementGuidance }) {
  if (!guidance.whyAmazonWantsIt) return null;
  return (
    <div className="flex items-start gap-2">
      <HelpCircle className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{C.guidance.why}: </span>
        {guidance.whyAmazonWantsIt}
      </p>
    </div>
  );
}

/** What a compliant record contains, and what will not pass — the half sellers most often miss. */
export function GuidanceStandards({ guidance }: { guidance: RequirementGuidance }) {
  return (
    <>
      {guidance.fields.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-medium text-foreground">{C.guidance.fields}</p>
          <ul className="list-disc space-y-1 pl-5">
            {guidance.fields.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {guidance.disqualifiers.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-medium text-foreground">{C.guidance.disqualifiers}</p>
          <ul className="list-disc space-y-1 pl-5">
            {guidance.disqualifiers.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/** Letters the seller sends themselves. The product never sends anything. */
export function GuidanceLetters({ guidance }: { guidance: RequirementGuidance }) {
  return (
    <>
      {guidance.letters.map((letter) => (
        <DetailDisclosure key={letter.id} title={`${C.guidance.letters} — ${letter.label}`}>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{letter.purpose}</p>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm">{letter.body}</pre>
            <CopyButton text={letter.body} label={`Copy ${letter.label.toLowerCase()}`} />
          </div>
        </DetailDisclosure>
      ))}
    </>
  );
}

/** Shown in view, not folded, once the seller has said they cannot obtain the record. */
export function CannotObtainRecorded({
  item,
  busy,
  onChange,
}: {
  item: Requirement;
  busy: boolean;
  onChange: (value: Requirement) => Promise<boolean>;
}) {
  if (item.status !== "cannot_obtain") return null;
  return (
    <Alert variant="warning">
      <AlertDescription className="space-y-3">
        <p>{C.cannotObtain.recorded}</p>
        <p className="text-foreground">“{item.declined?.reason}”</p>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void onChange({ ...item, status: "needed", declined: undefined })}
        >
          {C.cannotObtain.reopen}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

/** The honest path when a record cannot be obtained: the seller's reason, and what it costs. */
export function CannotObtainForm({
  item,
  guidance,
  busy,
  onChange,
}: {
  item: Requirement;
  guidance: RequirementGuidance;
  busy: boolean;
  onChange: (value: Requirement) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(item.declined?.reason ?? "");
  const [choice, setChoice] = useState<string | undefined>(item.declined?.alternativeId);
  if (item.status === "cannot_obtain") return null;

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        disabled={busy}
      >
        {C.cannotObtain.trigger}
      </Button>
      {open && (
        <div className="space-y-4 rounded-lg border border-border bg-surface-2 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">{C.cannotObtain.title}</p>
            <p className="text-xs text-muted-foreground">{C.cannotObtain.help}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`decline-${item.id}`}>{C.cannotObtain.reasonLabel}</Label>
            <Textarea
              id={`decline-${item.id}`}
              rows={3}
              maxLength={1000}
              value={reason}
              placeholder={C.cannotObtain.reasonPlaceholder}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{C.cannotObtain.alternatives}</p>
            {guidance.alternatives.map((alt) => (
              <div
                key={alt.id}
                className="space-y-2 rounded-row border border-border/60 bg-surface-1 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{alt.label}</p>
                  {choice === alt.id && (
                    <Badge variant="success" size="sm">
                      {C.cannotObtain.chosen}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{alt.honestyNote}</p>
                {/* Never softened, and never a probability — the point is the real cost. */}
                <p className="text-xs text-warning-ink">
                  <span className="font-medium">{C.cannotObtain.consequence}: </span>
                  {alt.consequence}
                </p>
                {choice !== alt.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setChoice(alt.id)}
                  >
                    {C.cannotObtain.choose}
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            disabled={busy || reason.trim().length < 10}
            onClick={async () => {
              const saved = await onChange({
                ...item,
                status: "cannot_obtain",
                declined: {
                  reason: reason.trim(),
                  alternativeId: choice,
                  at: new Date().toISOString(),
                },
              });
              if (saved) setOpen(false);
            }}
          >
            {C.cannotObtain.confirm}
          </Button>
        </div>
      )}
    </div>
  );
}
