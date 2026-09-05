"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckoutButton } from "@/components/CheckoutButton";
import { LEGAL } from "@/content/legal";
import { PRICING, SAMPLE_POA } from "@/content/marketing";
import { SHARED } from "@/content/shared";

export function PurchasePanel() {
  const [consent, setConsent] = useState(false);
  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="eu-consent"
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked === true)}
            className="mt-0.5"
            aria-describedby="eu-consent-label"
          />
          <label
            htmlFor="eu-consent"
            id="eu-consent-label"
            className="text-sm text-muted-foreground"
          >
            {LEGAL.consent.withdrawalCheckbox.label}
          </label>
        </div>
        <p className="text-xs text-muted-foreground">{LEGAL.consent.deliveryNote}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {consent ? (
          <CheckoutButton priceId={priceId} size="lg" className="flex-1" variant="default">
            {PRICING.cta}
          </CheckoutButton>
        ) : (
          <Button variant="outline" size="lg" className="flex-1" disabled>
            {SHARED.consentPrompt}
          </Button>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="lg">
              <FileText className="h-4 w-4" />
              {PRICING.samplePoa.trigger}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {SAMPLE_POA.title}
                <span className="text-xs font-normal text-muted-foreground">
                  ({SAMPLE_POA.watermark})
                </span>
              </DialogTitle>
            </DialogHeader>
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
              {SAMPLE_POA.body}
            </pre>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
