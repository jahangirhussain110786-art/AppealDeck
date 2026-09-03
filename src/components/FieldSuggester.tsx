"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Suggestions = {
  suggestedKind?: string;
  suggestedSeverity?: "low" | "medium" | "high" | "critical";
  suggestedTimelineSummary?: string;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "suggested"; suggestions: Suggestions }
  | { kind: "rules_only" }
  | { kind: "error"; message: string };

const MIN_TEXT_LENGTH = 20;

const KIND_LABELS: Record<string, string> = {
  INAUTHENTIC_DOCUMENTS: "Inauthentic documents",
  RELATED_ACCOUNT: "Related account",
  POLICY: "Policy violation",
  INTELLECTUAL_PROPERTY: "Intellectual property",
  LISTING: "Listing violation",
  FUNDS: "Funds hold",
  UNKNOWN: "Unknown / other",
};

const SEVERITY_LABELS: Record<NonNullable<Suggestions["suggestedSeverity"]>, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const SEVERITY_STYLES: Record<NonNullable<Suggestions["suggestedSeverity"]>, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

export function canSuggest(text: string): boolean {
  return text.trim().length >= MIN_TEXT_LENGTH;
}

interface FieldSuggesterProps {
  stepId: string;
  text: string;
}

export function FieldSuggester({ stepId, text }: FieldSuggesterProps) {
  const [state, setState] = useState<State>({ kind: "idle" });

  const enabled = canSuggest(text);

  async function handleSuggest() {
    if (!enabled) return;
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/extract-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, text }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setState({
          kind: "error",
          message: body?.error ?? `Request failed (${res.status})`,
        });
        return;
      }
      const body = await res.json();
      if (body?.ok && body.suggestions) {
        setState({ kind: "suggested", suggestions: body.suggestions });
      } else {
        setState({ kind: "rules_only" });
      }
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSuggest}
          disabled={!enabled || state.kind === "loading"}
          className="text-primary hover:text-primary"
        >
          {state.kind === "loading" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {state.kind === "loading" ? "Reading your answer..." : "Suggest fields (AI)"}
        </Button>
        {!enabled && text.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Write at least {MIN_TEXT_LENGTH} characters to get suggestions.
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {state.kind === "suggested" && (
          <motion.div
            key="suggested"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="rounded-lg border border-primary/30 bg-primary/5 p-3"
            data-testid="field-suggester-card"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                How the engine reads your answer
              </div>
              <button
                type="button"
                aria-label="Dismiss suggestions"
                onClick={() => setState({ kind: "idle" })}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="space-y-1.5 text-sm">
              {state.suggestions.suggestedKind && (
                <li className="flex items-baseline gap-2">
                  <span className="shrink-0 text-xs text-muted-foreground">Type</span>
                  <span className="text-foreground">
                    {KIND_LABELS[state.suggestions.suggestedKind] ??
                      state.suggestions.suggestedKind}
                  </span>
                </li>
              )}
              {state.suggestions.suggestedSeverity && (
                <li className="flex items-baseline gap-2">
                  <span className="shrink-0 text-xs text-muted-foreground">Severity</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-medium",
                      SEVERITY_STYLES[state.suggestions.suggestedSeverity],
                    )}
                  >
                    {SEVERITY_LABELS[state.suggestions.suggestedSeverity]}
                  </span>
                </li>
              )}
              {state.suggestions.suggestedTimelineSummary && (
                <li className="flex items-baseline gap-2">
                  <span className="shrink-0 text-xs text-muted-foreground">Timeline</span>
                  <span className="text-foreground">
                    {state.suggestions.suggestedTimelineSummary}
                  </span>
                </li>
              )}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              This is a read-only preview. Edit your answer above if it doesn&apos;t match.
            </p>
          </motion.div>
        )}

        {state.kind === "rules_only" && (
          <motion.div
            key="rules_only"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              AI suggestions are offline right now. Continue by hand — the engine still works
              without them.
            </span>
          </motion.div>
        )}

        {state.kind === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{state.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
