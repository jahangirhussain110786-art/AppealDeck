"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SerializedDeadline } from "@/core/deadlinesModel";
import { WORKSPACE as C } from "@/content/workspace";

/**
 * Lets the seller tell the case the response date Amazon shows them (24 Sep 2026).
 *
 * A notice often states no date, and the product rightly refuses to guess one and points to
 * Account Health. The seller then reads the date there — and until this existed had nowhere to
 * enter it, so the case's clock, the dashboard and the reminders stayed blank on exactly the case
 * that needed them. The date is saved as the seller's (`setBy: "seller"`), labelled as theirs, and
 * never overwritten when the notice is read again.
 */
export function SellerDeadlineField({
  entered,
  busy,
  onSave,
  onRemove,
}: {
  /** The date the seller already entered, if any. */
  entered: SerializedDeadline | undefined;
  busy: boolean;
  onSave: (dueOn: string) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
}) {
  const [value, setValue] = useState(entered?.dueOn ?? "");
  // Compared as calendar days in the seller's own time zone, which is how they read the date.
  const today = new Date().toLocaleDateString("en-CA");
  const past = Boolean(value) && value < today;

  if (entered) {
    return (
      <div className="mt-2 space-y-2">
        <p className="text-xs text-muted-foreground">{C.sellerDeadline.entered}</p>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void onRemove()}>
          {C.sellerDeadline.remove}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <Label htmlFor="seller-deadline" className="text-xs font-medium text-foreground">
        {C.sellerDeadline.label}
      </Label>
      <p className="text-xs text-muted-foreground">{C.sellerDeadline.help}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="seller-deadline"
          type="date"
          className="w-auto"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={busy || !value || past}
          onClick={() => void onSave(value)}
        >
          {C.sellerDeadline.save}
        </Button>
      </div>
      {past && <p className="text-xs text-warning">{C.sellerDeadline.past}</p>}
    </div>
  );
}
