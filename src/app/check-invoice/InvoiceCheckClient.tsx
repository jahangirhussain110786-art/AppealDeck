"use client";

import { useRef, useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { DocumentCheckPanel } from "@/components/DocumentCheckPanel";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { runDocumentCheck, type CheckOutcome } from "@/lib/documentChecks/runCheck";
import { CHECK_INVOICE as C } from "@/content/checkInvoice";

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
  const fileRef = useRef<{ bytes: Uint8Array; mimeType: string } | null>(null);

  async function check(): Promise<void> {
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
          caseData: { asins: asinsIn(asinText), referenceIds: [] },
          signedIn: false,
        }),
      );
    } catch {
      setOutcome({ kind: "unavailable", message: C.tool.failed });
    } finally {
      setBusy(false);
    }
  }

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
      <p className="text-sm text-muted-foreground">{C.tool.privacy}</p>
    </Card>
  );
}
