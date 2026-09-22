"use client";
import { useState } from "react";
import { History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailDisclosure } from "./WorkspaceVisuals";
import {
  priorAttempts,
  recordPriorAttempt,
  removePriorAttempt,
  type Workspace,
} from "@/core/workspace";
import { formatDate } from "@/lib/format";
import { WORKSPACE as C } from "@/content/workspace";

/**
 * #91: the question the product never asked.
 *
 * A seller usually arrives here after appealing once or twice on their own and being refused —
 * that refusal is what sent them looking for help. The product had no way to know it, so it
 * treated a third attempt as a first: nobody was told the response has to differ from the one
 * already rejected, and the duplicate-submission guard had nothing to compare against, even
 * though repeat-submission-without-change is the best-evidenced rejection cause in the research.
 *
 * Asked here, in the first step, because the answer changes the plan rather than decorating it.
 * Optional and reversible: a seller who has not appealed before leaves it alone, and one who
 * cannot remember the wording still gets the count, which is the part the rules depend on.
 */
export function PriorAttempts({
  workspace,
  busy,
  onSave,
}: {
  workspace: Workspace;
  busy: boolean;
  onSave: (w: Workspace) => Promise<boolean>;
}) {
  const [adding, setAdding] = useState(false);
  const [at, setAt] = useState("");
  const [text, setText] = useState("");
  const recorded = priorAttempts(workspace);

  async function add() {
    const ok = await onSave(
      recordPriorAttempt(workspace, {
        at: at ? new Date(at).toISOString() : "",
        text,
      }),
    );
    if (ok) {
      setAdding(false);
      setAt("");
      setText("");
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-surface-2/40 p-4">
      <div className="flex items-start gap-3">
        <History className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{C.priorAttemptsTitle}</p>
          <p className="text-sm text-muted-foreground">{C.priorAttemptsLead}</p>
        </div>
      </div>

      {recorded.length > 0 && (
        <ul className="space-y-2">
          {recorded.map((attempt) => (
            <li
              key={attempt.id}
              className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {attempt.at === new Date(0).toISOString()
                    ? C.priorAttemptNoDate
                    : formatDate(attempt.at)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {attempt.text ? attempt.text : C.priorAttemptNoText}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                aria-label={`Remove the response recorded for ${
                  attempt.at === new Date(0).toISOString()
                    ? C.priorAttemptNoDate
                    : formatDate(attempt.at)
                }`}
                onClick={() => void onSave(removePriorAttempt(workspace, attempt.id))}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {recorded.length > 0 && (
        <Alert variant="info">
          <AlertDescription>{C.priorAttemptsEffect}</AlertDescription>
        </Alert>
      )}

      {adding ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="prior-attempt-date">{C.priorAttemptDateLabel}</Label>
            <Input
              id="prior-attempt-date"
              type="date"
              value={at}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prior-attempt-text">{C.priorAttemptTextLabel}</Label>
            <Textarea
              id="prior-attempt-text"
              rows={4}
              maxLength={12000}
              value={text}
              placeholder={C.priorAttemptTextPlaceholder}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{C.priorAttemptTextHelp}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void add()}>
              {C.priorAttemptSave}
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" disabled={busy} onClick={() => setAdding(true)}>
            {recorded.length === 0 ? C.priorAttemptAddFirst : C.priorAttemptAddAnother}
          </Button>
          {recorded.length === 0 && (
            <DetailDisclosure title={C.priorAttemptsWhy}>
              <p>{C.priorAttemptsWhyBody}</p>
            </DetailDisclosure>
          )}
        </div>
      )}
    </div>
  );
}
