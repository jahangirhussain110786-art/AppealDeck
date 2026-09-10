"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { LEGAL } from "@/content/legal";

export interface ConsentRowProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  idPrefix?: string;
}

export function ConsentRow({ checked, onCheckedChange, idPrefix = "eu-consent" }: ConsentRowProps) {
  const labelId = `${idPrefix}-label`;
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Checkbox
          id={idPrefix}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          className="mt-0.5"
          aria-describedby={labelId}
        />
        <label htmlFor={idPrefix} id={labelId} className="text-sm text-muted-foreground">
          {LEGAL.consent.withdrawalCheckbox.label}
        </label>
      </div>
      <p className="text-xs text-muted-foreground">{LEGAL.consent.deliveryNote}</p>
    </div>
  );
}
