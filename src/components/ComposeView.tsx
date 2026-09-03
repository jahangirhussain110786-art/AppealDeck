"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, CheckCircle2, Copy, FileText, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getBrowserVault } from "@/lib/vault/browser";

interface PoaSection {
  heading: string;
  body: string;
}

interface ComposerMode {
  mode: "full-draft" | "gap-draft";
  reason: string;
}

interface CriticFinding {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
}

interface ComposeResult {
  draft: {
    docType: string;
    mode: ComposerMode;
    sections: PoaSection[];
    watermark?: string;
    metadata: {
      generatedAt: string;
      kind: string;
      evidenceComplete: boolean;
      attemptNumber: number;
    };
  };
  critique: {
    findings: CriticFinding[];
    passed: boolean;
  };
  rendered: string;
}

function ComposeInner() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComposeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<"generic" | "device_cap" | null>(null);

  const loadFromStorage = useCallback(() => {
    try {
      const raw = sessionStorage.getItem("appealdeck:caseFile");
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  }, []);

  useEffect(() => {
    const raw = searchParams?.get("caseFile") ?? loadFromStorage();
    if (!raw) {
      setError("No case file found. Please complete the guided interview first.");
      return;
    }

    let caseData: Record<string, unknown>;
    try {
      caseData = typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown>);
    } catch {
      setError("Invalid case file data.");
      return;
    }

    (async () => {
      try {
        const vault = getBrowserVault();
        if (vault.isUnlocked()) {
          const records = await vault.list();
          const slots = (caseData.evidenceSlots as Record<string, unknown>) ?? {};
          for (const r of records) {
            if (!r.evidenceKind) continue;
            slots[r.evidenceKind] = { present: true, vaultRecordId: r.id };
          }
          caseData.evidenceSlots = slots;
        }
      } catch {
        // vault not available — fall through with whatever slots were on the case
      }

      setLoading(true);
      fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseData }),
      })
        .then(async (res) => {
          if (res.status === 403) {
            const body = await res.json().catch(() => ({}) as any);
            if (body?.error === "device_cap_reached") {
              setError(`${body.message ?? "Device cap reached."} Manage devices in Billing.`);
              setErrorKind("device_cap");
              toast.error("Device limit reached", {
                description: "Revoke an older device in Billing to continue.",
              });
              return null;
            }
            setError(body?.error ?? `Compose failed (${res.status})`);
            setErrorKind("generic");
            return null;
          }
          if (!res.ok) throw new Error(`Compose failed (${res.status})`);
          return res.json();
        })
        .then((data: ComposeResult | null) => {
          if (data) setResult(data);
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Failed to compose");
          setErrorKind("generic");
        })
        .finally(() => setLoading(false));
    })();
  }, [searchParams, loadFromStorage]);

  const handleCopy = useCallback(() => {
    if (!result?.rendered) return;
    navigator.clipboard.writeText(result.rendered).then(
      () =>
        toast.success("Plan of Action copied to clipboard", {
          description: "Paste into Seller Central to edit and submit.",
        }),
      () =>
        toast.error("Copy failed", {
          description: "Your browser blocked clipboard access. Use Ctrl/Cmd+C manually.",
        }),
    );
  }, [result]);

  if (error && errorKind === "device_cap") {
    return (
      <Card className="border-warning/40 bg-warning/5">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <h3 className="font-medium text-foreground">Device limit reached</h3>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <a href="/app/billing">Manage devices in Billing</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <h3 className="font-medium text-foreground">Unable to compose</h3>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <a href="/app/case">Go to case</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Composing your plan of action…</span>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          {result.draft.watermark && (
            <Card className="border-warning/40 bg-warning/5">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  <div>
                    <h3 className="font-medium text-foreground">Gap draft</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.draft.mode.reason} The missing items are named below.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {result.critique.findings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Critic review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.critique.findings.map((f, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-3 text-sm",
                      f.severity === "error" &&
                        "border-destructive/40 bg-destructive/5 text-destructive",
                      f.severity === "warning" && "border-warning/40 bg-warning/5 text-warning",
                      f.severity === "info" && "border-border bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {f.severity === "error" ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <div>
                      <span className="font-mono text-xs uppercase">{f.code}</span>
                      <p>{f.message}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Plan of Action
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-pre-wrap rounded-lg border border-border bg-muted/20 p-4 font-mono text-sm text-foreground leading-relaxed"
              >
                {result.rendered}
              </motion.div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function ComposeView() {
  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="mb-2 pl-0">
          <a href="/app/case">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to case
          </a>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your POA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generated from your case file. Review, copy, and submit through Seller Central.
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="flex items-center gap-3 pt-5">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Loading…</span>
            </CardContent>
          </Card>
        }
      >
        <ComposeInner />
      </Suspense>
    </div>
  );
}

export default function ComposePage() {
  return <ComposeView />;
}
