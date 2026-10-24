"use client";

import { PARTNER_CODE_NOTE } from "@/content/audiences";
import { useState } from "react";
import { forgetPartnerCode, parsePartnerCode, rememberPartnerCode } from "@/lib/partnerCode";
import { usePartnerCode } from "@/lib/usePartnerCode";
import { GROWTH } from "@/content/growth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionState } from "@/lib/useSessionState";
import { FUNNEL_EVENTS, trackFunnelEvent } from "@/lib/analytics";

/**
 * Beside the pay button: if the seller arrived through a partner's link, the code that will go to
 * checkout is shown, with a way to drop it. The code comes from device storage through an external
 * store, so the server and the first paint agree and a code arriving later redraws the note.
 */
export function PartnerCodeNote({ eligible = true }: { eligible?: boolean }) {
  const code = usePartnerCode();
  if (!eligible)
    return code ? <p className="text-xs text-muted-foreground">{GROWTH.code.scope}</p> : null;
  if (process.env.NEXT_PUBLIC_REFERRALS_ENABLED === "true") return <ReferralCodeField />;
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

function ReferralCodeField() {
  const code = usePartnerCode();
  const session = useSessionState();
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<string | null>(null);
  const c = GROWTH.code;

  async function apply() {
    if (busy) return;
    const candidate = parsePartnerCode(draft ?? code);
    if (!candidate || !/^[A-Z0-9]{3,32}$/.test(candidate)) {
      setMessage(c.invalid);
      return;
    }
    if (code && code !== candidate) {
      setMessage(c.kept);
      return;
    }
    const held = rememberPartnerCode(candidate);
    if (held !== candidate) {
      setMessage(c.error);
      return;
    }
    if (session !== "signed-in") {
      setMessage(c.signin);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/referral/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: candidate }),
      });
      if (!response.ok) throw new Error();
      setChecked(candidate);
      trackFunnelEvent(FUNNEL_EVENTS.partnerCodeChecked, { result: "accepted" });
      setMessage(c.verified);
    } catch {
      setChecked(null);
      trackFunnelEvent(FUNNEL_EVENTS.partnerCodeChecked, { result: "unavailable" });
      setMessage(c.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-xl border border-border px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">
        {code ? `${c.label}: ${code}` : c.title}
      </summary>
      <div className="mt-3 space-y-3">
        <label htmlFor="partner-code" className="block text-xs font-medium">
          {c.label}
        </label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="partner-code"
            value={draft ?? code ?? ""}
            maxLength={32}
            autoComplete="off"
            spellCheck={false}
            placeholder={c.placeholder}
            disabled={busy}
            onChange={(event) => {
              setDraft(event.target.value);
              setMessage("");
              setChecked(null);
            }}
            className="min-w-0 flex-1 basis-36 font-mono"
            aria-describedby="partner-code-status"
          />
          <Button type="button" variant="outline" disabled={busy} onClick={() => void apply()}>
            {busy ? c.checking : c.apply}
          </Button>
        </div>
        <p id="partner-code-status" role="status" className="text-xs text-muted-foreground">
          {message || (code && checked !== code ? c.saved : c.scope)}
        </p>
        {code && (
          <button
            type="button"
            disabled={busy}
            className="min-h-11 text-link underline underline-offset-4"
            onClick={() => {
              forgetPartnerCode();
              setDraft(null);
              setMessage("");
              setChecked(null);
            }}
          >
            {c.remove}
          </button>
        )}
      </div>
    </details>
  );
}
