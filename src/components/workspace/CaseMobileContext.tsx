"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WORKSPACE as C } from "@/content/workspace";
import type { TimelineDeadline } from "./CaseOverview";

/**
 * The first screen of a case on a phone (24 Oct 2026). The sidebar sits below every tab, so the
 * three things a seller needs before reading one — when the case is due, that a guest's work is not
 * saved, and how to start another case — appear here instead. Hidden at xl and above, where the
 * sidebar beside the tabs says the same things.
 */
export function CaseMobileContext({
  deadlines,
  signedIn,
  signInHref,
  busy,
  onNewCase,
}: {
  deadlines: TimelineDeadline[];
  signedIn: boolean;
  signInHref: string;
  busy: boolean;
  onNewCase: () => void;
}) {
  return (
    <div className="space-y-2 xl:hidden">
      {deadlines.length > 0 && (
        <div className="rounded-[14px] border border-border bg-surface-1 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {C.overview.deadlines}
          </p>
          <ul className="mt-1 space-y-1 text-sm">
            {deadlines.map((line) => (
              <li
                key={line.text}
                className={line.hot ? "font-medium text-foreground" : "text-muted-foreground"}
              >
                {line.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!signedIn && (
        <div
          role="note"
          className="space-y-2.5 rounded-[14px] border border-warning/40 bg-warning/5 px-4 py-3"
        >
          <p className="text-sm font-medium text-foreground">{C.guestWarning.text}</p>
          <Button asChild size="sm">
            <Link href={signInHref}>{C.guestWarning.signIn}</Link>
          </Button>
        </div>
      )}
      {/* The app bar's "New case" has no room on a phone; here it is in the first screen. */}
      <Button size="sm" variant="outline" disabled={busy} onClick={onNewCase} className="sm:hidden">
        <Plus className="mr-1.5 h-4 w-4" aria-hidden />
        New case
      </Button>
    </div>
  );
}
