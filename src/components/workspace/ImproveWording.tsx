"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MIN_WORDING_CHARS } from "@/core/wordingLock";
import type { ViolationKind } from "@/core";
import type { WordingSection } from "@/lib/llm/improveWording";
import { WORKSPACE as C } from "@/content/workspace";

type State =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "suggestion"; original: string; text: string }
  | { kind: "message"; text: string };

/**
 * The opt-in wording help beside one section of the response (24 Sep 2026, founder-approved).
 *
 * Nothing happens unless the seller presses the button, and nothing changes unless they choose the
 * suggestion, which is shown beside their own text. The server checks recognized factual tokens;
 * the seller must still review claims and meaning before accepting it.
 */
export function ImproveWording({
  caseId,
  kind,
  section,
  text,
  question,
  signedIn,
  disabled,
  onAccept,
  attestationClears,
}: {
  caseId: string;
  kind: ViolationKind;
  section: WordingSection;
  text: string;
  question?: string;
  signedIn: boolean;
  disabled?: boolean;
  onAccept: (text: string) => void;
  /** The section carries the seller's confirmation, which choosing a suggestion clears. */
  attestationClears?: boolean;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const tooShort = text.trim().length < MIN_WORDING_CHARS;

  const ask = async () => {
    const original = text;
    setState({ kind: "working" });
    try {
      const res = await fetch("/api/improve-wording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, kind, section, text: original, question }),
      });
      if (res.status === 401) return setState({ kind: "message", text: C.improveWording.signIn });
      if (res.status === 402)
        return setState({ kind: "message", text: C.improveWording.needsPass });
      if (res.status === 429) return setState({ kind: "message", text: C.improveWording.tooMany });
      if (!res.ok) return setState({ kind: "message", text: C.improveWording.unavailable });
      const body = (await res.json()) as
        { ok: true; text: string; unchanged: boolean } | { ok: false; reason: string };
      if (body.ok) {
        return setState(
          body.unchanged
            ? { kind: "message", text: C.improveWording.unchanged }
            : { kind: "suggestion", original, text: body.text },
        );
      }
      setState({
        kind: "message",
        text:
          body.reason === "fact_changed"
            ? C.improveWording.factChanged
            : body.reason === "too_short"
              ? C.improveWording.tooShort
              : C.improveWording.unavailable,
      });
    } catch {
      setState({ kind: "message", text: C.improveWording.unavailable });
    }
  };

  if (!signedIn) return null;

  // A suggestion for text the seller has since edited is a suggestion for other words.
  const stale = state.kind === "suggestion" && state.original !== text;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled || tooShort || state.kind === "working"}
          onClick={() => void ask()}
        >
          <Sparkles className="mr-1.5 size-4" aria-hidden />
          {state.kind === "working" ? C.improveWording.working : C.improveWording.action}
        </Button>
        <span className="text-xs text-muted-foreground">
          {tooShort ? C.improveWording.tooShort : C.improveWording.sendsNote}
        </span>
      </div>

      {state.kind === "message" && (
        <p role="status" className="text-sm text-muted-foreground">
          {state.text}
        </p>
      )}

      {state.kind === "suggestion" && !stale && (
        <div className="space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {C.improveWording.yours}
              </p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{state.original}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">
                {C.improveWording.suggested}
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{state.text}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {C.improveWording.check}
            {attestationClears ? ` ${C.improveWording.attestationNote}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={disabled}
              onClick={() => {
                onAccept(state.text);
                setState({ kind: "idle" });
              }}
            >
              {C.improveWording.use}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setState({ kind: "idle" })}
            >
              {C.improveWording.keep}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
