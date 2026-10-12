"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CASE_LABEL_MAX, cleanCaseLabel } from "@/lib/caseLabel";
import { WORKSPACE as C } from "@/content/workspace";

/**
 * The seller's own name for the case (G-60). One line, optional, saved when the field is left or
 * Enter is pressed, and only when it changed. Someone running several accounts needs "Acme UK" in
 * the sidebar, not "Product safety · case 4f2a91".
 */
export function CaseLabelField({
  value,
  onSave,
}: {
  value: string;
  onSave: (label: string) => void;
}) {
  const [text, setText] = useState(value);

  function save() {
    const next = cleanCaseLabel(text);
    setText(next);
    if (next !== value) onSave(next);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="case-label" className="text-xs font-medium text-foreground">
        {C.caseLabel.label}
      </Label>
      <Input
        id="case-label"
        value={text}
        maxLength={CASE_LABEL_MAX}
        placeholder={C.caseLabel.placeholder}
        autoComplete="off"
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
      />
      <p className="text-xs text-muted-foreground">{C.caseLabel.help}</p>
    </div>
  );
}
