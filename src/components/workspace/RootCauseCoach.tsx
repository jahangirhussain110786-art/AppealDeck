"use client";
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { assembleRootCause, coachQuestions, type CoachQuestion } from "@/core/rootCauseCoach";
import type { ViolationKind } from "@/core/violationKinds";
import { coachDraftKey } from "@/lib/workspaceDraft";
import { WORKSPACE as C } from "@/content/workspace";

/**
 * Five short questions that lead a seller to one specific failure point, for the "What went wrong?"
 * box (10 Oct 2026). The answers are put together in the seller's own words and nothing is added, so
 * it cannot invent a fact. Kept with the other unsaved fields, so a reload does not lose them.
 * Closed by default: a seller who already knows what to write is not slowed down.
 */
export function RootCauseCoach({
  kind,
  draft,
  hasText,
  busy,
  onAnswer,
  onUse,
}: {
  kind: ViolationKind;
  draft: Record<string, string> | undefined;
  /** The box already holds text, so the answers are added below it rather than replacing it. */
  hasText: boolean;
  busy: boolean;
  onAnswer: (key: CoachQuestion["key"], value: string | undefined) => void;
  onUse: (text: string) => void;
}) {
  const id = useId();
  const K = C.coach;
  const questions = coachQuestions(kind);
  // What is typed lives here, read from the saved draft once. The draft prop only catches up after
  // the page's debounced save, so reading the boxes from it would show the last saved value, not the
  // keystroke just made.
  const [answers, setAnswers] = useState<Partial<Record<CoachQuestion["key"], string>>>(() =>
    Object.fromEntries(questions.map((q) => [q.key, draft?.[coachDraftKey(q.key)] ?? ""])),
  );
  const change = (key: CoachQuestion["key"], value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    onAnswer(key, value || undefined);
  };
  const assembled = assembleRootCause(answers);
  const anyAnswer = assembled.length > 0;

  return (
    <details className="group rounded-lg border border-border bg-muted/30">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span>{K.summary}</span>
        <ChevronDown
          className="size-4 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="space-y-4 border-t border-border px-4 py-4">
        <p className="text-sm text-muted-foreground">{K.intro}</p>
        {questions.map((q, i) => (
          <div key={q.key} className="space-y-1.5">
            <Label htmlFor={`${id}-${q.key}`}>
              {i + 1}. {q.label}
              {q.optional && (
                <span className="font-normal text-muted-foreground"> {K.optional}</span>
              )}
            </Label>
            <Textarea
              id={`${id}-${q.key}`}
              rows={2}
              maxLength={600}
              value={answers[q.key] ?? ""}
              readOnly={busy}
              aria-describedby={`${id}-${q.key}-help`}
              onChange={(e) => change(q.key, e.target.value)}
            />
            <p id={`${id}-${q.key}-help`} className="text-xs text-muted-foreground">
              {q.hint} {K.example} {q.example}
            </p>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            disabled={busy || !anyAnswer}
            onClick={() => {
              onUse(assembled);
              setAnswers({});
              for (const q of questions) onAnswer(q.key, undefined);
            }}
          >
            {hasText ? K.addBelow : K.use}
          </Button>
          <p className="text-xs text-muted-foreground">{K.after}</p>
        </div>
      </div>
    </details>
  );
}
