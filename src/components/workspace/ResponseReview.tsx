"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileCheck2, FilePenLine, CircleDot } from "lucide-react";
import { DetailDisclosure, IconTile } from "./WorkspaceVisuals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CopyButton } from "@/components/CopyButton";
import { ComposeGate } from "@/components/ComposeGate";
import {
  answerFor,
  questionnaireQuestions,
  totalAttempts,
  workspaceCanCompose,
  workspaceGaps,
  type Workspace,
} from "@/core/workspace";
import { answerDraftKey } from "@/lib/workspaceDraft";
import type { CaseFile } from "@/core/caseFile";
import type { Vault } from "@/core/vault/vault";
import type { CriticResult, PoaDraft } from "@/core/composer";
import { BeforeYouSubmitChecklist } from "@/components/BeforeYouSubmitChecklist";
import { IssuesRaised } from "./IssuesRaised";
import { assessNovelty, shouldWarnBeforeSubmit } from "@/core/submissionNovelty";
import { computeDraftStrength, DRAFT_STRENGTH_TONE } from "@/lib/draftStrength";
import { formatDate } from "@/lib/format";
import { openItemsAt } from "@/lib/submissionRecord";
import { WORKSPACE as C } from "@/content/workspace";

export type WorkspaceResponse = { rendered: string; draft: PoaDraft; critique: CriticResult };
export function ResponseReview({
  file,
  vault,
  signedIn,
  busy,
  result,
  purchase,
  draft,
  onDraftChange,
  signInHref,
  onSave,
  onGenerate,
  onSubmit,
}: {
  file: CaseFile & { workspace: Workspace };
  vault: Vault;
  signedIn: boolean;
  busy: boolean;
  result: WorkspaceResponse | null;
  purchase: boolean;
  draft?: Record<string, string>;
  onDraftChange: (key: string, value: string | undefined) => void;
  signInHref: string;
  onSave: (w: Workspace) => Promise<boolean>;
  onGenerate: () => void;
  onSubmit: (sent: { receipt: string; sentText?: string }) => Promise<boolean>;
}) {
  const w = file.workspace;
  const [explanation, setExplanation] = useState(draft?.["response.explanation"] ?? w.explanation);
  const [correctiveActions, setCorrective] = useState(
    draft?.["response.correctiveActions"] ?? w.correctiveActions,
  );
  const [preventiveMeasures, setPreventive] = useState(
    draft?.["response.preventiveMeasures"] ?? w.preventiveMeasures,
  );
  const [attested, setAttested] = useState(Boolean(w.correctiveActionsAttested));
  const questions = questionnaireQuestions(w);
  // Only answers edited here are held in state. The rest are read from the draft or the saved
  // case, so a re-pasted form with different questions never shows a stale answer.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answerValue = (q: string, i: number) =>
    answers[q] ?? draft?.[answerDraftKey(i)] ?? answerFor(w, q);
  const answersDirty = questions.some((q, i) => answerValue(q, i) !== answerFor(w, q));
  const [reviewed, setReviewed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [changedBeforeSending, setChangedBeforeSending] = useState(false);
  const [sentText, setSentText] = useState("");
  // AA-42: compares the rendered response against everything already recorded on this case.
  const novelty = React.useMemo(
    () => (result ? assessNovelty(result.rendered, w.submissions) : null),
    [result, w.submissions],
  );
  useEffect(() => {
    setReviewed(false);
    setSubmitted(false);
    setReceipt("");
    setChangedBeforeSending(false);
    setSentText("");
  }, [result]);
  const openItems = React.useMemo(
    () =>
      result
        ? openItemsAt(w, {
            rendered: result.rendered,
            mode: result.draft.mode.mode,
            findings: result.critique.findings,
          })
        : [],
    [result, w],
  );
  const dirty =
    explanation !== w.explanation ||
    correctiveActions !== w.correctiveActions ||
    preventiveMeasures !== w.preventiveMeasures ||
    // A-01: ticking the confirmation is itself a change worth saving. Without this the Save button
    // stays disabled and the attestation never reaches the vault.
    attested !== Boolean(w.correctiveActionsAttested) ||
    answersDirty;
  const gaps = workspaceGaps(w);
  const supported = workspaceCanCompose(w);
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="border-b border-border/60 bg-surface-2/50">
          <div className="flex items-center gap-3">
            <IconTile icon={FilePenLine} />
            <div>
              <p className="text-eyebrow uppercase text-muted-foreground">03 / Response</p>
              <CardTitle className="mt-1 text-lg">
                {w.protocol === "operational"
                  ? "What happened. What changed."
                  : "Your response brief"}
              </CardTitle>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Use confirmed facts. Your wording is preserved in the response.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {/*
            Audit item L (23 Sep 2026): a questionnaire is answered question by question, in
            Amazon's order and under Amazon's wording — not as one essay under one heading.
          */}
          {questions.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{C.questionnaire.intro}</p>
              {questions.map((q, i) => (
                <div key={q} className="space-y-2">
                  <Label htmlFor={`workspace-answer-${i}`}>{q}</Label>
                  <Textarea
                    id={`workspace-answer-${i}`}
                    rows={3}
                    maxLength={12000}
                    value={answerValue(q, i)}
                    onChange={(e) => {
                      const next = e.target.value;
                      setAnswers((a) => ({ ...a, [q]: next }));
                      onDraftChange(answerDraftKey(i), next === answerFor(w, q) ? undefined : next);
                      setReviewed(false);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="workspace-explanation">
              {w.protocol === "operational"
                ? "Root cause"
                : questions.length > 0
                  ? C.questionnaire.additional
                  : "Your factual explanation"}
            </Label>
            <Textarea
              id="workspace-explanation"
              rows={5}
              maxLength={12000}
              value={explanation}
              placeholder="Explain the issue using facts you can support…"
              onChange={(e) => {
                const next = e.target.value;
                setExplanation(next);
                onDraftChange("response.explanation", next === w.explanation ? undefined : next);
                setReviewed(false);
              }}
            />
          </div>
          {w.protocol === "operational" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="workspace-corrective">
                  Corrective actions and their actual status
                </Label>
                <Textarea
                  id="workspace-corrective"
                  rows={4}
                  maxLength={12000}
                  value={correctiveActions}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCorrective(next);
                    onDraftChange(
                      "response.correctiveActions",
                      next === w.correctiveActions ? undefined : next,
                    );
                    setReviewed(false);
                    // An attestation that survives an edit is an attestation to text the seller
                    // never read. The copy under the box promises this, so it has to be true.
                    setAttested(false);
                  }}
                />
                {/*
                  A-01 (EF-2). The attestation layer was built in readiness.ts and reachable by
                  nobody, so composer.ts's UNATTESTED_CLAIMS rule had never fired on a real case.
                  Amazon treats a corrective-action claim it later finds untrue far more harshly
                  than an incomplete appeal, which is why the seller confirms it themselves and why
                  the copy says plainly that we cannot check it.
                */}
                <label className="flex items-start gap-3 text-sm">
                  <input
                    className="mt-1 h-4 w-4 accent-primary"
                    type="checkbox"
                    checked={attested}
                    disabled={busy || !correctiveActions.trim()}
                    onChange={(e) => {
                      setAttested(e.target.checked);
                      setReviewed(false);
                    }}
                  />
                  {C.attestation.label}
                </label>
                {w.correctiveActionsAttested && attested && !dirty && (
                  <p className="text-xs text-muted-foreground">
                    {C.attestation.recorded.replace(
                      "{date}",
                      formatDate(w.correctiveActionsAttested.at),
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-prevention">
                  Prevention: owner, process and adoption status
                </Label>
                <Textarea
                  id="workspace-prevention"
                  rows={4}
                  maxLength={12000}
                  value={preventiveMeasures}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPreventive(next);
                    onDraftChange(
                      "response.preventiveMeasures",
                      next === w.preventiveMeasures ? undefined : next,
                    );
                    setReviewed(false);
                  }}
                />
              </div>
            </>
          )}
          <Button
            variant="outline"
            disabled={busy || !dirty}
            onClick={() =>
              void onSave({
                ...w,
                explanation,
                correctiveActions,
                preventiveMeasures,
                // Answers to questions no longer on the form are kept, not discarded: a re-pasted
                // form that words one question differently should not cost the seller their work.
                answers: [
                  ...(w.answers ?? []).filter((a) => !questions.includes(a.question)),
                  ...questions
                    .map((q, i) => ({ question: q, answer: answerValue(q, i) }))
                    .filter((a) => a.answer.trim()),
                ],
                correctiveActionsAttested: attested
                  ? (w.correctiveActionsAttested ?? { at: new Date().toISOString() })
                  : undefined,
              })
            }
          >
            Save response facts
          </Button>
          {/*
            #86: the confirmation sits with the response text, because that is where a seller can
            actually check whether both issues were covered. `workspaceGaps` requires it, so the
            case cannot be reported ready while one is unanswered.
          */}
          <IssuesRaised
            workspace={w}
            busy={busy}
            onConfirm={(confirmed) => void onSave({ ...w, issuesConfirmed: confirmed })}
          />
          {!supported ? (
            <Alert variant="info">
              <AlertTitle>Organize your notes first</AlertTitle>
              <AlertDescription>{C.unsupported}</AlertDescription>
            </Alert>
          ) : (
            <>
              {gaps.length > 0 && (
                <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CircleDot className="size-4 text-warning" aria-hidden />
                    <p className="text-sm font-semibold text-foreground">
                      {gaps.length} {gaps.length === 1 ? "item" : "items"} to resolve
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{gaps[0]}</p>
                  {gaps.length > 1 && (
                    <DetailDisclosure
                      title="See all unresolved items"
                      className="mt-3 border-warning/15 bg-background/50"
                    >
                      <ul className="list-disc space-y-2 pl-4">
                        {gaps.slice(1).map((gap, i) => (
                          <li key={i}>{gap}</li>
                        ))}
                      </ul>
                    </DetailDisclosure>
                  )}
                </div>
              )}
              {!signedIn ? (
                <Button asChild className="h-auto min-h-11 max-w-full whitespace-normal">
                  <Link href={signInHref}>
                    Sign in to prepare your response
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              ) : purchase ? (
                <ComposeGate vault={vault} caseId={file.id} onActivated={onGenerate} />
              ) : (
                <div className="space-y-2">
                  <Button disabled={busy || dirty} onClick={onGenerate}>
                    <FileCheck2 className="mr-2 h-4 w-4" aria-hidden />
                    {gaps.length ? "Prepare working draft" : "Prepare response"}
                  </Button>
                  {dirty && !busy && (
                    <p className="text-xs text-warning">
                      Save your response facts above before preparing the response.
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Requires an Appeal Pass for this case. Facts and file references go to AppealDeck;
                original files stay in your vault. Nothing is sent to Amazon.
              </p>
            </>
          )}
        </CardContent>
      </Card>
      {result && !dirty && (
        <Card>
          <CardHeader>
            <CardTitle>Review the exact response</CardTitle>
            <p className="text-sm text-muted-foreground">{result.draft.mode.reason}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {result.draft.watermark && (
              <Alert variant="warning">
                <AlertDescription>{result.draft.watermark}</AlertDescription>
              </Alert>
            )}
            <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-5 font-sans text-sm leading-loose shadow-inset sm:p-8">
              {result.rendered}
            </pre>
            {/*
              A-07: `draft.mode.reason` above answers "is every required record here". A draft can
              satisfy that and still be three blame-shifting sentences — which is exactly what the
              founder reported on 12 Sep 2026 being shown as "Full draft". This says how the writing
              reads, and the findings underneath it are what to do about that.
            */}
            {(() => {
              const strength = computeDraftStrength(result.draft.mode, result.critique.findings);
              return (
                <Alert variant={DRAFT_STRENGTH_TONE[strength]}>
                  <AlertDescription>
                    <span className="font-medium text-foreground">{C.draftStrength.label}: </span>
                    {C.draftStrength[strength]}
                  </AlertDescription>
                </Alert>
              );
            })()}
            {result.critique.findings.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.critique.findings.map((f, i) => (
                  <li key={i}>{f.message}</li>
                ))}
              </ul>
            )}
            <label className="flex items-start gap-3 text-sm">
              <input
                className="mt-1 h-4 w-4 accent-primary"
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              {C.finalReview}
            </label>
            {reviewed && (
              <CopyButton
                text={result.rendered}
                label={gaps.length ? "Copy working draft" : "Copy response"}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Download the linked originals from Evidence and attach them individually as the
              response form requires. Copying does not record a submission.
            </p>
            {/*
              Retiring the classic interview (22 Sep 2026): `BeforeYouSubmitChecklist` used to live
              only in `ComposeView`, which was that path's drafting step. Removing the path without
              bringing this across would have quietly cost the workspace its pre-submit review —
              the placeholder check and the "you submit this yourself" line have no equivalent in
              `workspaceGaps`. It is fed the workspace's own submission history, so its novelty row
              is the real text comparison rather than the attempt-count reminder.
            */}
            <BeforeYouSubmitChecklist
              caseFile={file}
              attemptCount={totalAttempts(w)}
              draftText={result.rendered}
              allChecked={result.critique.passed}
              priorSubmissions={w.submissions}
            />
            {/*
              AA-42: the duplicate-submission guard, placed where the seller is about to record a
              submission rather than buried in a checklist. It warns and explains; it never
              disables the button, because there are real cases where resending is correct and the
              decision is the seller's.
            */}
            {novelty && shouldWarnBeforeSubmit(novelty) && (
              <Alert variant="warning">
                <AlertTitle>This looks like what you already sent</AlertTitle>
                <AlertDescription>
                  {novelty.message}
                  {novelty.comparedTo && (
                    <span className="mt-2 block text-xs">
                      Compared against the response you recorded on{" "}
                      {formatDate(novelty.comparedTo.at)} · {Math.round(novelty.similarity * 100)}%
                      of this draft appeared there already
                      {novelty.addedSentences > 0
                        ? ` · ${novelty.addedSentences} new sentence${novelty.addedSentences === 1 ? "" : "s"}`
                        : ""}
                      .
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {/*
              Recording is open whatever state the draft is in (audit item R, 23 Sep 2026). What
              the seller sent is a fact about their case; refusing to record it made the attempt
              count and the duplicate guard wrong from then on. Open items are shown here and kept
              with the record — never as approval.
            */}
            <div className="space-y-4 border-t border-border pt-5">
              <p className="text-sm font-medium text-foreground">{C.recordTitle}</p>
              {openItems.length > 0 && (
                <Alert variant="warning">
                  <AlertTitle>{C.openItemsTitle}</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {openItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <span className="mt-2 block">{C.openItemsNote}</span>
                  </AlertDescription>
                </Alert>
              )}
              <fieldset className="space-y-2 text-sm">
                <legend className="sr-only">{C.whatWasSent}</legend>
                <label className="flex items-start gap-3">
                  <input
                    className="mt-1 h-4 w-4 accent-primary"
                    type="radio"
                    name="workspace-sent-as"
                    checked={!changedBeforeSending}
                    onChange={() => setChangedBeforeSending(false)}
                  />
                  {C.sentAsShown}
                </label>
                <label className="flex items-start gap-3">
                  <input
                    className="mt-1 h-4 w-4 accent-primary"
                    type="radio"
                    name="workspace-sent-as"
                    checked={changedBeforeSending}
                    onChange={() => setChangedBeforeSending(true)}
                  />
                  {C.sentChanged}
                </label>
              </fieldset>
              {changedBeforeSending && (
                <div className="space-y-2">
                  <Label htmlFor="workspace-sent-text">{C.sentTextLabel}</Label>
                  <Textarea
                    id="workspace-sent-text"
                    value={sentText}
                    maxLength={60000}
                    rows={8}
                    onChange={(e) => setSentText(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="workspace-receipt">
                  Submission reference or receipt note (optional)
                </Label>
                <Input
                  id="workspace-receipt"
                  value={receipt}
                  maxLength={2000}
                  onChange={(e) => setReceipt(e.target.value)}
                />
              </div>
              <label className="flex items-start gap-3 text-sm">
                <input
                  className="mt-1 h-4 w-4 accent-primary"
                  type="checkbox"
                  checked={submitted}
                  onChange={(e) => setSubmitted(e.target.checked)}
                />
                {changedBeforeSending ? C.submitConfirmChanged : C.submitConfirm}
              </label>
              <Button
                disabled={
                  busy ||
                  !reviewed ||
                  !submitted ||
                  (changedBeforeSending && sentText.trim().length === 0)
                }
                onClick={() =>
                  void onSubmit({
                    receipt,
                    sentText: changedBeforeSending ? sentText : undefined,
                  })
                }
              >
                Record submission
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
