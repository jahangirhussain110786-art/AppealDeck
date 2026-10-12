"use client";

import { useRef, useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { DocumentCheckPanel } from "@/components/DocumentCheckPanel";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { runDocumentCheck, type CheckOutcome } from "@/lib/documentChecks/runCheck";
import { CHECK_INVOICE as C } from "@/content/checkInvoice";
import { invoiceSums } from "@/core/invoiceSums";

/** An ASIN is ten characters starting B0; anything else typed in the box is ignored, not guessed at. */
const ASIN = /\bB0[A-Z0-9]{8}\b/g;

function asinsIn(text: string): string[] {
  return [...new Set(text.toUpperCase().match(ASIN) ?? [])].slice(0, 20);
}

/**
 * The free invoice check (8 Oct 2026). A guest-only front door to the case's own document check:
 * `signedIn: false` sends the file straight to the reading on this device, so nothing is uploaded
 * and nothing is saved. The invoice is held in memory only for "Check again" and is dropped when
 * the seller picks another file or closes the tab.
 */
export function InvoiceCheckClient() {
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [asinText, setAsinText] = useState("");
  // G-02: both optional, both only ever used on this device.
  const [noticeDate, setNoticeDate] = useState("");
  const [unitsText, setUnitsText] = useState("");
  const fileRef = useRef<{ bytes: Uint8Array; mimeType: string } | null>(null);

  async function check(dateOverride?: string): Promise<void> {
    const date = dateOverride ?? noticeDate;
    const file = fileRef.current;
    if (!file || busy) return;
    setBusy(true);
    try {
      setOutcome(
        await runDocumentCheck({
          caseId: "",
          kind: "INAUTHENTIC",
          evidenceKind: "supplier_invoice",
          bytes: file.bytes,
          mimeType: file.mimeType,
          caseData: {
            asins: asinsIn(asinText),
            referenceIds: [],
            ...(/^\d{4}-\d{2}-\d{2}$/.test(date) ? { noticeDate: date } : {}),
          },
          signedIn: false,
        }),
      );
    } catch {
      setOutcome({ kind: "unavailable", message: C.tool.failed });
    } finally {
      setBusy(false);
    }
  }

  /** The sums for the invoice just read, recomputed as the two optional numbers are typed. */
  const sums =
    outcome?.kind === "fields" && outcome.result.evidenceKind === "supplier_invoice"
      ? invoiceSums(outcome.result, {
          ...(/^\d{4}-\d{2}-\d{2}$/.test(noticeDate) ? { noticeDate } : {}),
          today: new Date().toISOString().slice(0, 10),
          ...(unitsText ? { unitsSold: Number(unitsText) } : {}),
        })
      : null;

  async function onFile(file: File): Promise<boolean> {
    fileRef.current = {
      bytes: new Uint8Array(await file.arrayBuffer()),
      mimeType: file.type || "application/octet-stream",
    };
    setOutcome(null);
    await check();
    return true;
  }

  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{C.tool.title}</h2>
      <div className="space-y-2">
        <Label htmlFor="invoice-asin">{C.tool.asinLabel}</Label>
        <Input
          id="invoice-asin"
          value={asinText}
          onChange={(e) => setAsinText(e.target.value)}
          placeholder={C.tool.asinPlaceholder}
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
        />
        <p className="text-sm text-muted-foreground">{C.tool.asinHelp}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invoice-notice-date">{C.tool.noticeDateLabel}</Label>
          <Input
            id="invoice-notice-date"
            type="date"
            value={noticeDate}
            onChange={(e) => {
              setNoticeDate(e.target.value);
              // Count the field comparison from the new date too, so the two never disagree.
              if (fileRef.current) void check(e.target.value);
            }}
          />
          <p className="text-sm text-muted-foreground">{C.tool.noticeDateHelp}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice-units">{C.tool.unitsLabel}</Label>
          <Input
            id="invoice-units"
            inputMode="numeric"
            value={unitsText}
            onChange={(e) => setUnitsText(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
            placeholder={C.tool.unitsPlaceholder}
            autoComplete="off"
          />
          <p className="text-sm text-muted-foreground">{C.tool.unitsHelp}</p>
        </div>
      </div>
      <FileDropZone
        onFile={onFile}
        disabled={busy}
        multiple={false}
        hint={C.tool.dropHint}
        accept="application/pdf,image/png,image/jpeg,image/webp"
      />
      {(busy || outcome) && (
        <DocumentCheckPanel
          outcome={outcome}
          busy={busy}
          onCheck={() => void check()}
          processing="device_text"
        />
      )}
      {sums && (
        <section aria-labelledby="invoice-sums-title" className="space-y-4">
          <h3 id="invoice-sums-title" className="text-lg font-semibold text-foreground">
            {C.sums.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{C.sums.lead}</p>
          {sums.days && (
            <div className="rounded-lg bg-surface-2 p-4 ring-1 ring-inset ring-border">
              <p className="text-sm font-semibold text-foreground">{C.sums.daysTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                {sums.days.sentence}
              </p>
            </div>
          )}
          {sums.units && (
            <div className="rounded-lg bg-surface-2 p-4 ring-1 ring-inset ring-border">
              <p className="text-sm font-semibold text-foreground">{C.sums.unitsTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                {sums.units.sentence}
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{C.sums.note}</p>
        </section>
      )}
      <p className="text-sm text-muted-foreground">{C.tool.privacy}</p>
    </Card>
  );
}
