"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Check, FileSearch, FileText, ShieldAlert, Signpost } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DetailDisclosure, IconTile } from "./WorkspaceVisuals";
import { PriorAttempts } from "./PriorAttempts";
import { IssuesRaised } from "./IssuesRaised";
import { PROTOCOL_LABELS, routeWorkspace, type Workspace } from "@/core/workspace";
import { WORKSPACE as C } from "@/content/workspace";
import { DECODE } from "@/content/marketing";
import { assessNoticeAuthenticity } from "@/core/noticeAuthenticity";
import { stripInvisibleChars } from "@/lib/idNormalize";
import { KindOverride } from "./KindOverride";
import type { ViolationKind } from "@/core";

const selectStyle =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
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
  const noticeField = (
    <div className="space-y-2">
      <Label htmlFor="workspace-notice">{C.notice}</Label>
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
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start gap-4 border-b border-border/60 bg-surface-2/50">
        <IconTile icon={FileSearch} tone="info" />
        <div className="space-y-1">
          <p className="text-eyebrow text-muted-foreground">01 / Request review</p>
          <CardTitle className="text-lg">
            {workspace.decodedNoticeHash ? "Review your decoded request" : C.routeIntro}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {workspace.decodedNoticeHash ? C.decodedHelp : C.routeHelp}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {workspace.decodedNoticeHash ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 px-4 py-3">
              <FileText className="size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Amazon notice</p>
                <p className="text-xs text-muted-foreground">
                  {value.notice === workspace.notice ? "Saved from Decode" : "Unsaved notice edits"}{" "}
                  · {value.notice.length.toLocaleString("en-US")} characters
                </p>
              </div>
              {value.notice === workspace.notice && (
                <Check className="size-4 text-primary" aria-hidden />
              )}
            </div>
            <DetailDisclosure
              title="Read or edit your notice"
              className="rounded-t-none border-x-0 border-b-0 bg-transparent"
            >
              {noticeField}
            </DetailDisclosure>
          </div>
        ) : (
          noticeField
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="workspace-market">Marketplace on the notice</Label>
            <select
              id="workspace-market"
              className={selectStyle}
              value={value.marketplace}
              onChange={(e) =>
                setValue({ ...value, marketplace: e.target.value as Workspace["marketplace"] })
              }
            >
              <option value="US">Amazon US</option>
              <option value="other">Another marketplace / unsure</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspace-position">Your position on the allegation</Label>
            <select
              id="workspace-position"
              className={selectStyle}
              value={value.position}
              onChange={(e) =>
                setValue({ ...value, position: e.target.value as Workspace["position"] })
              }
            >
              <option value="unsure">I need to understand it first</option>
              <option value="accept">I acknowledge the issue described</option>
              <option value="dispute">I disagree with the allegation</option>
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
            onChange={(e) => {
              const next = stripInvisibleChars(e.target.value);
              setValue({ ...value, formInstructions: next });
              onDraftChange(
                "request.formInstructions",
                next === workspace.formInstructions ? undefined : next,
              );
            }}
          />
          <p className="text-xs text-muted-foreground">{C.formHelp}</p>
        </div>
        {/*
          B-06: beside the suggested route, because both answer "did you read my notice correctly"
          and a seller who disagrees with one usually disagrees with the other.
        */}
        {/*
          Keyed by the kind so it remounts when the kind changes underneath it. Its select holds
          `useState(kind)`, which only reads the prop once — so if our classification changed the
          kind while this was open, the select would default to the old one, and applying it would
          revert our reading and record that as the seller's choice.
        */}
        <KindOverride key={kind} kind={kind} busy={busy} onChange={onKindChange} />
        <div className="flex items-start gap-3 rounded-lg bg-info/5 p-4 ring-1 ring-inset ring-info/15">
          <Signpost className="mt-0.5 size-5 shrink-0 text-info" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Suggested route</p>
            <p className="mt-1 font-medium text-foreground">{PROTOCOL_LABELS[route.protocol]}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-foreground">
                Why this route?
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{route.reason}</p>
            </details>
          </div>
        </div>
        {/* #86: named here so a seller learns on the first screen that two things must be answered. */}
        <IssuesRaised workspace={workspace} />
        {/*
          #91: asked in the first step, because a seller who has already been refused once needs a
          different response, not a differently-formatted one — and that changes the plan rather
          than decorating it. Saved through the same `onSave` as everything else here.
        */}
        <PriorAttempts workspace={workspace} busy={busy} onSave={onCommitWorkspace} />
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={busy || value.notice.trim().length < 30}
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
            Save for later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
