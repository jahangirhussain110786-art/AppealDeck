"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { LEGAL, READ_TERMS } from "@/content/legal";

export interface ConsentRowProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  idPrefix?: string;
}

/**
 * The ticked sentence, with the two document names as links. They open in a new tab so a buyer who
 * stops to read the Terms does not lose the checkout they are in. The text is the stored label, split
 * on the sentence `READ_TERMS` builds it from; if the label ever stops ending in that sentence the
 * whole label is shown as plain text rather than a half-linked one.
 */
function ConsentLabel() {
  const label = LEGAL.consent.withdrawalCheckbox.label;
  const read = `${READ_TERMS.prefix}${READ_TERMS.terms}${READ_TERMS.joiner}${READ_TERMS.refund}${READ_TERMS.suffix}`;
  if (!label.endsWith(read)) return <>{label}</>;
  const link = "font-medium text-link underline underline-offset-2";
  return (
    <>
      {label.slice(0, label.length - read.length)}
      {READ_TERMS.prefix}
      <a href="/terms" target="_blank" rel="noopener noreferrer" className={link}>
        {READ_TERMS.terms}
      </a>
      {READ_TERMS.joiner}
      <a href="/refund" target="_blank" rel="noopener noreferrer" className={link}>
        {READ_TERMS.refund}
      </a>
      {READ_TERMS.suffix}
    </>
  );
}

export function ConsentRow({ checked, onCheckedChange, idPrefix = "eu-consent" }: ConsentRowProps) {
  const labelId = `${idPrefix}-label`;
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-[14px] bg-card p-4 ring-1 ring-inset ring-border">
        <Checkbox
          id={idPrefix}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          className="mt-0.5"
          aria-describedby={labelId}
        />
        <label htmlFor={idPrefix} id={labelId} className="text-sm text-muted-foreground">
          <ConsentLabel />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">{LEGAL.consent.deliveryNote}</p>
    </div>
  );
}
