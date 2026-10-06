"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Check, FileText, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DetailDisclosure } from "./WorkspaceVisuals";
import { PriorAttempts } from "./PriorAttempts";
import { IssuesRaised } from "./IssuesRaised";
import {
  PROTOCOL_LABELS,
  proposedRequirements,
  routeWorkspace,
  type Workspace,
} from "@/core/workspace";
import { WORKSPACE as C } from "@/content/workspace";
import { DECODE } from "@/content/marketing";
import { APP } from "@/content/app";
import { assessNoticeAuthenticity } from "@/core/noticeAuthenticity";
import { stripInvisibleChars } from "@/lib/idNormalize";
import { detectOtherAmazonStore } from "@/lib/amazonStore";
import { KindOverride } from "./KindOverride";
import type { ViolationKind } from "@/core";

const selectStyle =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The first case screen. Calm pass, 29 Sep 2026: the seller has usually just read the decode
 * result, so this shows what we read as a short summary and folds every control that changes it
 * under one "Change it" disclosure. Nothing was removed — each field below is the one that was
 * here before, and the two buttons save exactly what they saved before.
 */
export function RequestReview({
  workspace,
  kind,
  busy,
  onSave,
  onCommitWorkspace,
  onKindChange,
  draft,
  onDraftChange,
}: {
  workspace: Workspace;
  /** B-06: what the decoder read, so the seller can say it is wrong. */
  kind: ViolationKind;
  busy: boolean;
  /** Confirms the route. Only the fields a route confirmation may change survive it. */
  onSave: (w: Workspace) => Promise<boolean>;
  /** Saves the workspace as given. Needed by anything on this step that changes another field. */
  onCommitWorkspace: (w: Workspace) => Promise<boolean>;
  /** B-06: corrects the violation kind and adds any records the new kind requires. */
  onKindChange: (next: ViolationKind) => Promise<boolean>;
  draft?: Record<string, string>;
  onDraftChange: (key: string, value: string | undefined) => void;
}) {
  const [value, setValue] = useState({
    ...workspace,
    notice: draft?.["request.notice"] ?? workspace.notice,
    formInstructions: draft?.["request.formInstructions"] ?? workspace.formInstructions,
  });
  const route = routeWorkspace(value);
  /*
    #87: the same check the decode page runs, here as well, because a seller can paste a notice
    straight into the workspace without ever visiting /decode. Recomputed as they type — a
    forgery pasted here has to be caught before they start building a response to it.
  */
  const authenticity = useMemo(() => assessNoticeAuthenticity(value.notice), [value.notice]);
  // A hint only: the store choice decides the route, so it is never changed for the seller.
  const otherStore = useMemo(() => detectOtherAmazonStore(value.notice), [value.notice]);
  const decoded = Boolean(workspace.decodedNoticeHash);
  const R = C.request;
  const tooShort = value.notice.trim().length < 30;
  // Counted the way confirming will list them, so the seller sees the size of the job first.
  const documents = workspace.confirmed
    ? workspace.requirements.length
    : proposedRequirements(value, kind).length;
  const wants =
    documents === 0
      ? PROTOCOL_LABELS[route.protocol]
      : (documents === 1 ? R.wantsWithDoc : R.wantsWithDocs)
          .replace("{route}", PROTOCOL_LABELS[route.protocol])
          .replace("{n}", String(documents));

  const noticeField = (
    <div className="space-y-2">
      <Label htmlFor="workspace-notice">{C.notice}</Label>
      <Textarea
        id="workspace-notice"
        value={value.notice}
        maxLength={50000}
        rows={7}
        onChange={(e) => {
          // Sanitised here, at the point the notice is stored, because entities.ts guarantees
          // raw.slice(start, end) === value and stripping later would slide every span.
          const next = stripInvisibleChars(e.target.value);
          setValue({ ...value, notice: next });
          onDraftChange("request.notice", next === workspace.notice ? undefined : next);
        }}
      />
    </div>
  );

  const summary: Array<[string, string]> = [
    [R.problem, kind === "UNKNOWN" ? R.notClear : APP.violationKinds[kind]],
    [R.store, R.stores[value.marketplace]],
    [R.wants, wants],
    [R.agree, R.positions[value.position]],
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/60">
        <div className="space-y-1">
          <CardTitle as="h2" className="text-[1.375rem] tracking-[-0.025em]">
            {decoded ? R.decodedTitle : C.routeIntro}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{decoded ? C.decodedHelp : C.routeHelp}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {/* Never folded: a forgery has to be seen before the seller builds anything on it. */}
        {authenticity.worthChecking && (
          <Alert variant="warning">
            <ShieldAlert aria-hidden />
            <div className="space-y-2">
              <AlertTitle>{DECODE.result.authenticityTitle}</AlertTitle>
              <AlertDescription>{DECODE.result.authenticityLead}</AlertDescription>
              <ul className="space-y-2">
                {authenticity.signals.map((signal) => (
                  <li key={signal.id} className="text-sm">
                    <span className="font-medium text-foreground">{signal.label}</span>
                    <span className="block text-muted-foreground">{signal.detail}</span>
                  </li>
                ))}
              </ul>
              <AlertDescription className="font-medium">
                {DECODE.result.authenticityAction}
              </AlertDescription>
            </div>
          </Alert>
        )}
        {decoded ? (
          <div className="rounded-lg border border-border/70 bg-surface-2/60">
            <div className="flex items-center gap-3 px-4 py-3">
              <FileText className="size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{C.notice}</p>
                <p className="text-xs text-muted-foreground">
                  {value.notice === workspace.notice ? R.savedFromDecode : R.unsavedEdits} ·{" "}
                  {R.characters.replace("{n}", value.notice.length.toLocaleString("en-US"))}
                </p>
              </div>
              {value.notice === workspace.notice && (
                <Check className="size-4 text-success" aria-hidden />
              )}
            </div>
            <DetailDisclosure
              title={R.seeNotice}
              className="rounded-t-none border-x-0 border-b-0 bg-transparent"
            >
              {noticeField}
            </DetailDisclosure>
          </div>
        ) : (
          noticeField
        )}
        {/* The answer first. Hidden until there is enough notice to read, so it never shows noise. */}
        {!tooShort && (
          <dl aria-label={R.summaryLabel} className="divide-y divide-border/70">
            {summary.map(([label, text]) => (
              <div
                key={label}
                className="grid gap-0.5 py-3 first:pt-0 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-4"
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-[0.9375rem] font-medium text-foreground">
                  {text}
                  {label === R.wants && (
                    <details className="mt-1 font-normal">
                      <summary className="cursor-pointer text-sm text-link">{R.whyRoute}</summary>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {route.reason}
                      </p>
                    </details>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {/* #86: named here so a seller learns on the first screen that two things must be answered. */}
        <IssuesRaised workspace={workspace} />
        {otherStore && value.marketplace === "US" && (
          <Alert>
            <AlertDescription>
              {`Your notice mentions ${otherStore} — check the store is right. Only Amazon US requests are supported here; if this one is from another store, choose "${R.stores.other}" under "${R.change}".`}
            </AlertDescription>
          </Alert>
        )}
        {/*
          Every control that changes the summary, in one place. Open from the start when the notice
          was typed here rather than decoded, because then there is nothing to summarise yet.
        */}
        <DetailDisclosure title={R.change} open={!decoded}>
          <div className="space-y-5 pt-1 text-foreground">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workspace-market">{R.store}</Label>
                <select
                  id="workspace-market"
                  className={selectStyle}
                  value={value.marketplace}
                  onChange={(e) =>
                    setValue({ ...value, marketplace: e.target.value as Workspace["marketplace"] })
                  }
                >
                  <option value="US">{R.stores.US}</option>
                  <option value="other">{R.stores.other}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-position">{R.agree}</Label>
                <select
                  id="workspace-position"
                  className={selectStyle}
                  value={value.position}
                  onChange={(e) =>
                    setValue({ ...value, position: e.target.value as Workspace["position"] })
                  }
                >
                  <option value="unsure">{R.positions.unsure}</option>
                  <option value="accept">{R.positions.accept}</option>
                  <option value="dispute">{R.positions.dispute}</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-form">{C.form}</Label>
              <Textarea
                id="workspace-form"
                rows={3}
                value={value.formInstructions}
                placeholder="Paste the document requests or questions shown on the response page…"
                maxLength={12000}
                aria-describedby="workspace-form-help"
                onChange={(e) => {
                  const next = stripInvisibleChars(e.target.value);
                  setValue({ ...value, formInstructions: next });
                  onDraftChange(
                    "request.formInstructions",
                    next === workspace.formInstructions ? undefined : next,
                  );
                }}
              />
              <p id="workspace-form-help" className="text-xs text-muted-foreground">
                {C.formHelp}
              </p>
            </div>
            {/*
              Keyed by the kind so it remounts when the kind changes underneath it. Its select holds
              `useState(kind)`, which only reads the prop once — so if our classification changed the
              kind while this was open, the select would default to the old one, and applying it
              would revert our reading and record that as the seller's choice.
            */}
            <KindOverride key={kind} kind={kind} busy={busy} onChange={onKindChange} />
          </div>
        </DetailDisclosure>
        {/*
          #91: asked in the first step, because a seller who has already been refused once needs a
          different response, not a differently-formatted one — and that changes the plan rather
          than decorating it. Saved through the same `onSave` as everything else here.
        */}
        <PriorAttempts workspace={workspace} busy={busy} onSave={onCommitWorkspace} />
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={busy || tooShort}
              aria-describedby={tooShort ? "workspace-confirm-why" : undefined}
              onClick={() =>
                void onSave({
                  ...value,
                  protocol: route.protocol,
                  confirmed: true,
                  requirementsConfirmed: false,
                })
              }
            >
              {C.confirmRoute}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void onSave({ ...value, protocol: route.protocol, confirmed: false })}
            >
              {R.saveLater}
            </Button>
          </div>
          {/* A disabled button says why, rather than looking broken. */}
          {tooShort && (
            <p id="workspace-confirm-why" className="text-xs text-muted-foreground">
              {R.tooShort}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
