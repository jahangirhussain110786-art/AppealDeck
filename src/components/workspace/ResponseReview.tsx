"use client";
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
import { workspaceCanCompose, workspaceGaps, type Workspace } from "@/core/workspace";
import type { CaseFile } from "@/core/interviewEngine";
import type { Vault } from "@/core/vault/vault";
import type { CriticResult, PoaDraft } from "@/core/composer";
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
  onSubmit: (receipt: string) => Promise<boolean>;
}) {
  const w = file.workspace;
  const [explanation, setExplanation] = useState(draft?.["response.explanation"] ?? w.explanation);
  const [correctiveActions, setCorrective] = useState(
    draft?.["response.correctiveActions"] ?? w.correctiveActions,
  );
  const [preventiveMeasures, setPreventive] = useState(
    draft?.["response.preventiveMeasures"] ?? w.preventiveMeasures,
  );
  const [reviewed, setReviewed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receipt, setReceipt] = useState("");
  useEffect(() => {
    setReviewed(false);
    setSubmitted(false);
    setReceipt("");
  }, [result]);
  const dirty =
    explanation !== w.explanation ||
    correctiveActions !== w.correctiveActions ||
    preventiveMeasures !== w.preventiveMeasures;
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
          <div className="space-y-2">
            <Label htmlFor="workspace-explanation">
              {w.protocol === "operational" ? "Root cause" : "Your factual explanation"}
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
                  }}
                />
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
              void onSave({ ...w, explanation, correctiveActions, preventiveMeasures })
            }
          >
            Save response facts
          </Button>
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
            {result.draft.mode.mode === "full-draft" &&
              result.critique.passed &&
              gaps.length === 0 && (
                <div className="space-y-4 border-t border-border pt-5">
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
                    {C.submitConfirm}
                  </label>
                  <Button
                    disabled={busy || !reviewed || !submitted}
                    onClick={() => void onSubmit(receipt)}
                  >
                    Record submission
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
