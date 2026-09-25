"use client";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { VIOLATION_KINDS, type ViolationKind } from "@/core";
import { APP } from "@/content/app";
import { WORKSPACE as C } from "@/content/workspace";

/**
 * B-06: let the seller correct what the decoder read.
 *
 * K12 pre-agreed "classification-confidence display and user override verified working" as the
 * response to a wrong-classification signal, and no mechanism was ever built — entities and the
 * decoded kind rendered read-only everywhere. An expert will disagree with the classifier
 * sometimes, and a tool an expert cannot correct is a tool an expert cannot use, which matters
 * more now that the audience is an appeal writer rather than a seller found through ads.
 *
 * It is also no longer cosmetic. Since B-05 the violation kind decides which unspoken records get
 * raised, and it already decided the per-record guidance and whether the case is routed to
 * professional help. One wrong reading produced three wrong answers and there was no way back.
 *
 * The correction is additive by construction (`requirementsAfterKindChange`): nothing a seller has
 * already reviewed is removed for telling us we were wrong.
 */
export function KindOverride({
  kind,
  busy,
  onChange,
}: {
  kind: ViolationKind;
  busy: boolean;
  onChange: (next: ViolationKind) => Promise<boolean>;
}) {
  const [choice, setChoice] = useState<ViolationKind>(kind);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-1 p-4">
      <div className="flex items-start gap-3">
        <SlidersHorizontal className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{C.kindOverride.title}</p>
          <p className="text-xs text-muted-foreground">{C.kindOverride.help}</p>
          <p className="mt-2 text-sm text-foreground">{APP.violationKinds[kind]}</p>
        </div>
      </div>

      {open ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="workspace-kind">{C.kindOverride.label}</Label>
            <NativeSelect
              id="workspace-kind"
              value={choice}
              disabled={busy}
              onChange={(e) => setChoice(e.target.value as ViolationKind)}
            >
              {VIOLATION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {APP.violationKinds[k]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <p className="text-xs text-muted-foreground">{C.kindOverride.effect}</p>
          <Button
            size="sm"
            disabled={busy || choice === kind}
            onClick={async () => {
              if (await onChange(choice)) setOpen(false);
            }}
          >
            {C.kindOverride.apply}
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => setOpen(true)}>
          {C.kindOverride.open}
        </Button>
      )}
    </div>
  );
}
