"use client";

import { useState } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { IconTile } from "./WorkspaceVisuals";
import type { CaseFacts } from "@/core/workspace";
import { coverageSentence, type InvoiceCoverage } from "@/core/invoiceCoverage";
import { WORKSPACE as C } from "@/content/workspace";

/**
 * The seller's registered business details and suppliers, stated once for the case.
 *
 * Added 24 Sep 2026 (ChatGPT audit item G). A document check can now compare an invoice's buyer
 * block with the seller account, and its supplier with the suppliers the seller named — but only
 * with facts the seller has actually stated. Nothing here is inferred from a document: a value
 * read off one invoice and then used to judge another would be the product agreeing with itself.
 *
 * Saved on an explicit button rather than per keystroke, because each field is a statement the
 * seller is making about their business, and a half-typed address should not be compared with
 * anything.
 */
export function CaseFactsCard({
  facts,
  coverage,
  busy,
  onSave,
}: {
  facts: CaseFacts | undefined;
  /** The checked invoices added up against `unitsSold`, when the seller has stated it. */
  coverage?: InvoiceCoverage | null;
  busy: boolean;
  onSave: (facts: CaseFacts) => Promise<boolean>;
}) {
  const [name, setName] = useState(facts?.businessName ?? "");
  const [address, setAddress] = useState(facts?.businessAddress ?? "");
  const [suppliers, setSuppliers] = useState((facts?.suppliers ?? []).join("\n"));

  const [units, setUnits] = useState(facts?.unitsSold ? String(facts.unitsSold) : "");

  const next = toCaseFacts(name, address, suppliers, units);
  const unchanged =
    JSON.stringify(next) ===
    JSON.stringify(
      toCaseFacts(
        facts?.businessName ?? "",
        facts?.businessAddress ?? "",
        (facts?.suppliers ?? []).join("\n"),
        facts?.unitsSold ? String(facts.unitsSold) : "",
      ),
    );

  const saved = Boolean(facts && Object.keys(facts).length > 0);
  /*
    Calm pass, 29 Sep 2026: optional, so it closes to one line until the seller wants it, and opens
    by itself once details are saved (so they are visible to check). Hidden, never unmounted, so a
    half-typed address survives closing it.
  */
  const [open, setOpen] = useState(saved);
  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="case-facts-body"
          onClick={() => setOpen(!open)}
          className="-m-2 flex items-center gap-3 rounded-lg p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <IconTile icon={Building2} />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold leading-snug tracking-tight text-foreground">
              {C.caseFacts.title}
            </span>
            <span className="block text-sm text-muted-foreground">
              {saved && facts?.businessName ? facts.businessName : C.caseFacts.closed}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </CardHeader>
      <CardContent id="case-facts-body" hidden={!open} className="space-y-4">
        <p className="text-sm text-muted-foreground">{C.caseFacts.description}</p>
        <div className="space-y-2">
          <Label htmlFor="case-facts-name">{C.caseFacts.businessName}</Label>
          <Input
            id="case-facts-name"
            value={name}
            maxLength={300}
            autoComplete="organization"
            spellCheck={false}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="case-facts-address">{C.caseFacts.businessAddress}</Label>
          <Textarea
            id="case-facts-address"
            value={address}
            maxLength={1000}
            rows={2}
            autoComplete="street-address"
            spellCheck={false}
            disabled={busy}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="case-facts-suppliers">{C.caseFacts.suppliers}</Label>
          <Textarea
            id="case-facts-suppliers"
            value={suppliers}
            rows={3}
            spellCheck={false}
            disabled={busy}
            aria-describedby="case-facts-suppliers-help"
            onChange={(e) => setSuppliers(e.target.value)}
          />
          <p id="case-facts-suppliers-help" className="text-xs text-muted-foreground">
            {C.caseFacts.suppliersHelp}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="case-facts-units">{C.caseFacts.unitsSold}</Label>
          <Input
            id="case-facts-units"
            inputMode="numeric"
            value={units}
            maxLength={8}
            spellCheck={false}
            disabled={busy}
            aria-describedby="case-facts-units-help"
            onChange={(e) => setUnits(e.target.value.replace(/\D/g, ""))}
          />
          <p id="case-facts-units-help" className="text-xs text-muted-foreground">
            {C.caseFacts.unitsSoldHelp}
          </p>
        </div>
        {coverage && (
          <div
            role="status"
            className={cn(
              "rounded-lg border p-3 text-sm",
              coverage.status === "short"
                ? "border-warning/40 bg-warning/10"
                : "border-border bg-muted/40",
            )}
          >
            <p className="font-medium text-foreground">{C.caseFacts.coverageTitle}</p>
            <p className="mt-1 text-muted-foreground">{coverageSentence(coverage)}</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            disabled={busy || unchanged}
            onClick={() => void onSave(next)}
          >
            {C.caseFacts.save}
          </Button>
          <p className="text-xs text-muted-foreground">{C.caseFacts.privacy}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Trimmed, empty fields left out, suppliers de-duplicated — so saving blank clears rather than
 * storing an empty string that a comparison would then have to know to ignore. */
export function toCaseFacts(
  name: string,
  address: string,
  suppliers: string,
  units = "",
): CaseFacts {
  const list = [
    ...new Set(
      suppliers
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ].slice(0, 20);
  return {
    ...(name.trim() ? { businessName: name.trim() } : {}),
    ...(address.trim() ? { businessAddress: address.trim() } : {}),
    ...(list.length > 0 ? { suppliers: list } : {}),
    ...(Number(units) > 0 && Number(units) <= 10_000_000
      ? { unitsSold: Math.floor(Number(units)) }
      : {}),
  };
}
