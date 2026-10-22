"use client";

import { PARTNER_CODE_NOTE } from "@/content/audiences";
import { forgetPartnerCode } from "@/lib/partnerCode";
import { usePartnerCode } from "@/lib/usePartnerCode";

/**
 * Beside the pay button: if the seller arrived through a partner's link, the code that will go to
 * checkout is shown, with a way to drop it. The code comes from device storage through an external
 * store, so the server and the first paint agree and a code arriving later redraws the note.
 */
export function PartnerCodeNote() {
  const code = usePartnerCode();
  if (!code) return null;
  const [before, after] = PARTNER_CODE_NOTE.text.split("{code}");
  return (
    <p className="text-xs text-muted-foreground" role="status">
      {before}
      <strong className="font-mono text-foreground">{code}</strong>
      {after}{" "}
      <button
        type="button"
        className="text-link underline underline-offset-4"
        onClick={() => forgetPartnerCode()}
      >
        {PARTNER_CODE_NOTE.remove}
      </button>
    </p>
  );
}
