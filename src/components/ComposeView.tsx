"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getBrowserVault } from "@/lib/vault/browser";
import { loadCaseFile } from "@/lib/caseStore";
import { PoaSection, PoaFindingsList } from "@/components/PoaSection";
import { BeforeYouSubmitChecklist } from "@/components/BeforeYouSubmitChecklist";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { CopyButton } from "@/components/CopyButton";
import { APP } from "@/content/app";

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
  const [editedSections, setEditedSections] = useState<Record<number, string>>({});

  const loadFromVault = useCallback(async (): Promise<unknown> => {
    try {
      const vault = getBrowserVault();
      if (vault.isUnlocked()) {
        const existing = await loadCaseFile(vault);
        return existing;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  useEffect(() => {
    const run = async () => {
      const sp = searchParams?.get("caseFile");
      const raw = sp ?? (await loadFromVault());
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
    };

    void run();
  }, [searchParams, loadFromVault]);

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
                <a href="/billing">Manage devices in Billing</a>
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
                  <a href="/case">Go to case</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <Loader2 className="h-5 w-5" />
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
                    <h3 className="font-medium text-foreground">{APP.compose.gapDraft.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.draft.mode.reason} {APP.compose.gapDraft.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <PoaFindingsList findings={result.critique.findings} />

          {result.draft.sections.map((section, i) => {
            const edited = editedSections[i] ?? section.body;
            return (
              <PoaSection
                key={i}
                section={section}
                index={i}
                findings={result.critique.findings}
                draftText={edited}
                onEdit={(idx, text) => setEditedSections((prev) => ({ ...prev, [idx]: text }))}
              />
            );
          })}

          <div className="flex items-center justify-between">
            <CopyButton text={result.rendered} label={APP.compose.copyAll} className="gap-2" />
          </div>

          <BeforeYouSubmitChecklist
            caseFile={{
              kind: result.draft.metadata.kind as any,
              evidenceSlots: {},
              actionItems: [],
            }}
            attemptCount={result.draft.metadata.attemptNumber - 1}
            draftText={Object.values(editedSections).join("\n\n")}
            allChecked={result.critique.passed}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="border-t border-border pt-4 text-center text-sm text-muted-foreground"
          >
            {APP.compose.checklist.submitYourself}
          </motion.div>

          <HonestExpectationsCard
            summary={APP.dashboard.noPassCard.summary}
            whatToDo={APP.dashboard.noPassCard.whatToDo}
          />
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
          <a href="/case">
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
              <Loader2 className="h-5 w-5" />
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
