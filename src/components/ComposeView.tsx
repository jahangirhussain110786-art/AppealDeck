"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, FileText, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { EmptyState } from "@/components/EmptyState";
import { VaultGate } from "@/components/VaultGate";
import { PoaSection, PoaFindingsList } from "@/components/PoaSection";
import { BeforeYouSubmitChecklist } from "@/components/BeforeYouSubmitChecklist";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { CopyButton } from "@/components/CopyButton";
import { getBrowserVault } from "@/lib/vault/browser";
import type { Vault } from "@/core/vault/vault";
import { loadCaseFile, loadCaseLog } from "@/lib/caseStore";
import { formatDate } from "@/lib/format";
import { groupFindingsBySection } from "@/lib/findingSections";
import { buildClipboardText } from "@/lib/poaClipboard";
import { GLOBAL_EXPECTATIONS } from "@/core";
import type { CaseFile, CriticResult, EvidenceKind, PoaDraft } from "@/core";
import { APP } from "@/content/app";
import { SHARED } from "@/content/shared";

interface ComposeResult {
  draft: PoaDraft;
  critique: CriticResult;
  rendered: string;
}

type Phase =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; reason: "generic" | "device_cap"; message: string }
  | { kind: "ready"; caseFile: CaseFile; result: ComposeResult };

/** Upper bound the compose API accepts for attemptNumber. */
const MAX_ATTEMPT_NUMBER = 99;

function useVaultInstance(): Vault {
  const ref = useRef<Vault | null>(null);
  if (ref.current === null) {
    ref.current = getBrowserVault();
  }
  return ref.current;
}

/** Mark an evidence kind present when a vault record carries it (uploads made in the interview). */
async function withVaultEvidence(vault: Vault, file: CaseFile): Promise<CaseFile> {
  const evidenceSlots = { ...file.evidenceSlots };
  try {
    for (const record of await vault.list()) {
      if (!record.evidenceKind) continue;
      const kind = record.evidenceKind as EvidenceKind;
      evidenceSlots[kind] = { ...evidenceSlots[kind], present: true };
    }
  } catch {
    // Listing failed: keep the slots recorded on the case file.
  }
  return { ...file, evidenceSlots };
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : APP.compose.error.fallback;
}

function ComposeSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">{APP.compose.loading}</span>
      <Skeleton className="h-14 w-full" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  );
}

function ComposeInner({ vault }: { vault: Vault }) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [editedSections, setEditedSections] = useState<Record<number, string>>({});

  const update = useCallback((next: Phase) => setPhase(next), []);

  const run = useCallback(async () => {
    let cancelled = false;
    const safeUpdate = (next: Phase) => {
      if (!cancelled) update(next);
    };

    let loaded: { file: CaseFile; priorAttempts: number } | undefined;
    try {
      const file = await loadCaseFile(vault);
      if (!file) {
        safeUpdate({ kind: "empty" });
        return;
      }
      const log = await loadCaseLog(vault);
      loaded = { file, priorAttempts: log?.attemptCount ?? file.attemptCount };
    } catch (e) {
      safeUpdate({ kind: "error", reason: "generic", message: errorMessage(e) });
      return;
    }
    if (!loaded) return;

    const caseData = await withVaultEvidence(vault, loaded.file);
    const attemptNumber = Math.min(MAX_ATTEMPT_NUMBER, loaded.priorAttempts + 1);

    try {
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseData, attemptNumber }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        if (res.status === 403 && body.error === "device_cap_reached") {
          toast.error(APP.compose.deviceCap.title, {
            description: APP.compose.deviceCap.description,
          });
          safeUpdate({
            kind: "error",
            reason: "device_cap",
            message: body.message ?? APP.compose.deviceCap.description,
          });
          return;
        }
        safeUpdate({
          kind: "error",
          reason: "generic",
          message: body.error ?? `${APP.compose.error.fallback} (${res.status})`,
        });
        return;
      }
      const result = (await res.json()) as ComposeResult;
      safeUpdate({ kind: "ready", caseFile: caseData, result });
    } catch (e) {
      safeUpdate({ kind: "error", reason: "generic", message: errorMessage(e) });
    }
    return () => {
      cancelled = true;
    };
  }, [vault, update]);

  useEffect(() => {
    void run();
  }, [run]);

  if (phase.kind === "loading") {
    return <ComposeSkeleton />;
  }

  if (phase.kind === "empty") {
    return (
      <EmptyState
        icon={FileText}
        title={APP.compose.empty.title}
        description={APP.compose.empty.description}
        action={
          <Button asChild>
            <Link href="/case">{APP.compose.empty.cta}</Link>
          </Button>
        }
      />
    );
  }

  if (phase.kind === "error") {
    const isDeviceCap = phase.reason === "device_cap";
    const Icon = isDeviceCap ? ShieldAlert : AlertCircle;
    const copy = isDeviceCap ? APP.compose.deviceCap : APP.compose.error;
    return (
      <Alert variant={isDeviceCap ? "warning" : "destructive"}>
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <AlertTitle>{copy.title}</AlertTitle>
          <AlertDescription>
            <p>{phase.message}</p>
            <div className="mt-2 flex gap-2">
              {!isDeviceCap && (
                <Button variant="outline" size="sm" onClick={() => void run()}>
                  {SHARED.retryButton}
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href={isDeviceCap ? "/billing" : "/case"}>{copy.action}</Link>
              </Button>
            </div>
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  const { caseFile, result } = phase;
  const { draft, critique } = result;
  const isGapDraft = draft.mode.mode === "gap-draft";
  const banner = isGapDraft ? APP.compose.gapDraft : APP.compose.fullDraft;
  const mergedSections = draft.sections.map((s, i) => editedSections[i] ?? s.body);
  const fullDraftText = buildClipboardText(
    draft.sections.map((s) => ({ heading: s.heading, body: s.body })),
    editedSections,
  );
  const { bySection, global } = groupFindingsBySection(critique.findings, draft.sections);

  return (
    <div className="space-y-4">
      <Alert variant="info">
        <div>
          <AlertTitle>{banner.title}</AlertTitle>
          <AlertDescription>
            <p>{isGapDraft ? `${draft.mode.reason} ${banner.description}` : banner.description}</p>
            {draft.watermark && <p className="font-mono text-xs">{draft.watermark}</p>}
          </AlertDescription>
        </div>
      </Alert>

      <PoaFindingsList findings={global} />

      {draft.sections.map((section, i) => (
        <PoaSection
          key={section.heading}
          section={section}
          index={i}
          findings={bySection[i] ?? []}
          draftText={mergedSections[i] ?? section.body}
          onEdit={(idx, text) => setEditedSections((prev) => ({ ...prev, [idx]: text }))}
        />
      ))}

      <div className="print-only hidden whitespace-pre-wrap font-serif text-sm">
        <p className="mb-4 font-medium">
          {APP.compose.print.header.replace("{date}", formatDate(new Date()))}
        </p>
        {fullDraftText}
      </div>

      <div className="flex items-center justify-between">
        <CopyButton text={fullDraftText} label={APP.compose.copyAll} className="gap-2" />
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="as-pasted">
          <AccordionTrigger className="text-sm font-medium">
            {APP.compose.asPasted.toggle}
          </AccordionTrigger>
          <AccordionContent>
            <pre className="whitespace-pre-wrap font-mono text-sm">{fullDraftText}</pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <BeforeYouSubmitChecklist
        caseFile={caseFile}
        attemptCount={draft.metadata.attemptNumber - 1}
        draftText={fullDraftText}
        allChecked={critique.passed}
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
        summary={GLOBAL_EXPECTATIONS.typicalNote}
        whatToDo={[...GLOBAL_EXPECTATIONS.whatWeDo, ...GLOBAL_EXPECTATIONS.whatWeDoNot]}
      />
    </div>
  );
}

export default function ComposeView() {
  const vault = useVaultInstance();

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="mb-2 pl-0">
          <Link href="/case">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            {APP.compose.backButton}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {APP.compose.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{APP.compose.subtitle}</p>
      </div>

      <VaultGate vault={vault}>{(unlocked) => <ComposeInner vault={unlocked} />}</VaultGate>
    </div>
  );
}
