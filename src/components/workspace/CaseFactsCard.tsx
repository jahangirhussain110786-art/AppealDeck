"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTile } from "./WorkspaceVisuals";
import type { CaseFacts } from "@/core/workspace";
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
  busy,
  onSave,
}: {
  facts: CaseFacts | undefined;
  busy: boolean;
  onSave: (facts: CaseFacts) => Promise<boolean>;
}) {
  const [name, setName] = useState(facts?.businessName ?? "");
  const [address, setAddress] = useState(facts?.businessAddress ?? "");
  const [suppliers, setSuppliers] = useState((facts?.suppliers ?? []).join("\n"));

  const next = toCaseFacts(name, address, suppliers);
  const unchanged =
    JSON.stringify(next) ===
    JSON.stringify(
      toCaseFacts(
        facts?.businessName ?? "",
        facts?.businessAddress ?? "",
        (facts?.suppliers ?? []).join("\n"),
      ),
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <IconTile icon={Building2} />
          <CardTitle className="text-base">{C.caseFacts.title}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{C.caseFacts.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
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
export function toCaseFacts(name: string, address: string, suppliers: string): CaseFacts {
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
  };
}
