"use client";

import { useState } from "react";
import { AlertTriangle, FileText, Inbox, Info, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { NativeSelect } from "@/components/ui/native-select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { CopyButton } from "@/components/CopyButton";
import { CaseStateBadge } from "@/components/CaseStateBadge";
import { EvidenceStatusBadge } from "@/components/EvidenceStatusBadge";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { DeadlineChipList } from "@/components/DeadlineChip";
import { ClockBriefCard } from "@/components/ClockBriefCard";
import { DocumentCheckPanel } from "@/components/DocumentCheckPanel";
import { buildClockBrief, requirementsFor } from "@/core";
import { FactsLedgerCard } from "@/components/FactsLedgerCard";
import { buildFactsLedger } from "@/core/factsLedger";
import { buildDocumentCheck } from "@/core/documentCheck";
import type { CheckOutcome } from "@/lib/documentChecks/runCheck";
import { VerifiedStamp } from "@/components/VerifiedStamp";
import { Stepper } from "@/components/Stepper";
import { Logo, LogoMark } from "@/components/Logo";
import { SectionHeading } from "@/components/SectionHeading";
import { HeroArtifact } from "@/components/marketing/HeroArtifact";
import { ShieldCheckIllustration } from "@/components/illustrations/ShieldCheckIllustration";
import { VaultDoorIllustration } from "@/components/illustrations/VaultDoorIllustration";
import { MagnifierDocumentIllustration } from "@/components/illustrations/MagnifierDocumentIllustration";
import { AccentWord } from "@/components/ui/accent-word";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { APP } from "@/content/app";
import { GLOBAL_EXPECTATIONS } from "@/core";

export function DevUiGallery() {
  // Built once per mount: Date.now() during render would give a new answer on every render.
  const [sampleDeadlines] = useState(() => [
    {
      kind: "appeal_window" as const,
      dueAt: new Date(Date.now() + 8 * 86_400_000),
      label: "Appeal window: 7 days from notice",
    },
    {
      kind: "funds_appeal_eligible" as const,
      dueAt: new Date(Date.now() + 60 * 86_400_000),
      label: "Funds appeal becomes available (~60 days from deactivation)",
    },
    {
      kind: "funds_review" as const,
      dueAt: new Date(Date.now() + 90 * 86_400_000),
      label: "Funds review checkpoint (~90 days) - release is NEVER automatic",
    },
    {
      kind: "indefinite_hold" as const,
      dueAt: null,
      label: "Severity-gated - indefinite hold (inauthentic / fraud)",
    },
  ]);

  return (
    <main className="mx-auto flex w-full max-w-app flex-col gap-10 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Design system gallery
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dev-only view. Every primitive and pattern in one place for screenshot QA. Returns 404 in
          production.
        </p>
      </div>

      <Section title="Typography & tokens">
        <Card>
          <CardContent className="space-y-2 pt-5">
            <p className="text-display font-semibold">Display</p>
            <h1 className="text-2xl font-semibold">Heading 1</h1>
            <h2 className="text-xl font-semibold">Heading 2</h2>
            <h3 className="text-lg font-semibold">Heading 3</h3>
            <p className="text-base">
              Body text with <span data-tn>tabular 1,234 nums</span>.
            </p>
            <p className="text-sm text-muted-foreground">Small muted helper text.</p>
            <p className="text-xs text-muted-foreground">Micro caption text.</p>
            <Kbd>Cmd+K</Kbd>
          </CardContent>
        </Card>
      </Section>

      <Section title="Logo">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-6 pt-5">
            <div className="flex flex-col items-center gap-2">
              <LogoMark size={24} />
              <span className="text-xs text-muted-foreground">sm mark</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LogoMark size={28} />
              <span className="text-xs text-muted-foreground">md mark</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LogoMark size={36} />
              <span className="text-xs text-muted-foreground">lg mark</span>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="flex flex-col items-center gap-2">
              <Logo size="sm" />
              <span className="text-xs text-muted-foreground">sm wordmark</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Logo size="md" />
              <span className="text-xs text-muted-foreground">md wordmark</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Logo size="lg" />
              <span className="text-xs text-muted-foreground">lg wordmark</span>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="bg-surface-1 p-4">
            <Logo size="md" />
            <p className="mt-2 text-xs text-muted-foreground">Light surface strip</p>
          </Card>
          <Card className="border-border/40 bg-surface-inverse p-4">
            <Logo size="md" />
            <p className="mt-2 text-xs text-background/70">Dark surface strip</p>
          </Card>
        </div>
      </Section>

      <Section title="SectionHeading">
        <Card className="p-6">
          <SectionHeading
            eyebrow="Pattern"
            title="A section heading, left-aligned"
            description="Eyebrow, title and an optional description line — used on every marketing section."
          />
        </Card>
      </Section>

      <Section title="Buttons">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-5">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
            <Button disabled>Disabled</Button>
          </CardContent>
        </Card>
      </Section>

      <Section title="Badges — tinted vs solid">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-5">
            <Badge>Default (tinted)</Badge>
            <Badge variant="solid">Solid</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <CaseStateBadge kind="POLICY" />
            <CaseStateBadge kind="INAUTHENTIC_DOCUMENTS" />
            <EvidenceStatusBadge status="present" />
            <EvidenceStatusBadge status="missing" />
            <EvidenceStatusBadge status="pending" />
            <VerifiedStamp checkedOn="2026-09-01" />
          </CardContent>
        </Card>
      </Section>

      <Section title="Alerts">
        <div className="grid gap-3">
          <Alert variant="info">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>Decode runs locally. No notice text is uploaded.</AlertDescription>
            </div>
          </Alert>
          <Alert variant="warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Funds review is a checkpoint, not an automatic release.
              </AlertDescription>
            </div>
          </Alert>
          <Alert variant="destructive">
            <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <AlertTitle>Severity-gated</AlertTitle>
              <AlertDescription>
                Inauthentic-document cases without a verifiable supplier invoice are routed to
                professional help.
              </AlertDescription>
            </div>
          </Alert>
          <Alert variant="success">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Plan of Action copied to clipboard.</AlertDescription>
            </div>
          </Alert>
        </div>
      </Section>

      <Section title="Skeleton">
        <Card>
          <CardContent className="space-y-2 pt-5">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      </Section>

      <Section title="Progress">
        <Card>
          <CardContent className="space-y-4 pt-5">
            <Progress value={68} aria-label="Readiness progress" />
            <p className="text-xs text-muted-foreground">
              case-file completeness - not a prediction
            </p>
          </CardContent>
        </Card>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="one" className="w-full">
          <TabsList>
            <TabsTrigger value="one">Notice</TabsTrigger>
            <TabsTrigger value="two">Interview</TabsTrigger>
            <TabsTrigger value="three">POA</TabsTrigger>
          </TabsList>
          <TabsContent value="one" className="text-sm text-muted-foreground">
            Decoded notice content.
          </TabsContent>
          <TabsContent value="two" className="text-sm text-muted-foreground">
            Intake question state.
          </TabsContent>
          <TabsContent value="three" className="text-sm text-muted-foreground">
            Drafted Plan of Action.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Form controls">
        <Card>
          <CardContent className="space-y-3 pt-5">
            <div className="space-y-1.5">
              <Label htmlFor="email-demo">Email</Label>
              <Input id="email-demo" type="email" placeholder="you@business.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kind-demo">Evidence kind</Label>
              <NativeSelect id="kind-demo" defaultValue="supplier_invoice">
                {Object.entries(APP.evidenceKinds).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="consent-demo" />
              <Label htmlFor="consent-demo">I consent to immediate delivery.</Label>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="Tooltip on an inverse surface">
        <Card className="border-border/40 bg-surface-inverse p-6">
          <TooltipProvider delayDuration={100}>
            <Tooltip defaultOpen>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover or focus me</Button>
              </TooltipTrigger>
              <TooltipContent>Tooltip content on a dark tile</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Card>
      </Section>

      <Section title="Sheet & Dialog (motion check)">
        <Card>
          <CardContent className="flex flex-wrap gap-3 pt-5">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Mobile menu</SheetTitle>
                  <SheetDescription>
                    Slides in from the right, animate-slide-in-right.
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sample dialog</DialogTitle>
                  <DialogDescription>Zooms in with animate-zoom-in.</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </Section>

      <Section title="Table">
        <Card>
          <CardContent className="pt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>What you get</TableHead>
                  <TableHead>Free</TableHead>
                  <TableHead>Appeal Pass</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Decode</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Plan of Action</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Section>

      <Section title="Patterns - DeadlineChip">
        <DeadlineChipList deadlines={sampleDeadlines} />
      </Section>

      <Section title="Patterns - HeroArtifact">
        <HeroArtifact />
      </Section>

      <Section title="Patterns - HonestExpectationsCard (single list)">
        <HonestExpectationsCard
          summary="We decode the notice in your browser. We draft a Plan of Action grounded in the notice and your evidence."
          whatToDo={[
            "Read the plain-English summary and the deadlines.",
            "Decide whether to act on the do-now list yourself or buy the Appeal Pass.",
            "If you buy, the Pass drafts your POA; you edit and submit it yourself.",
          ]}
        />
      </Section>

      <Section title="Patterns - HonestExpectationsCard (two column)">
        <HonestExpectationsCard
          summary={GLOBAL_EXPECTATIONS.typicalNote}
          weDo={GLOBAL_EXPECTATIONS.whatWeDo}
          weDoNot={GLOBAL_EXPECTATIONS.whatWeDoNot}
        />
      </Section>

      <Section title="Patterns - CopyButton">
        <Card>
          <CardContent className="flex items-center gap-2 pt-5">
            <code className="rounded bg-muted px-2 py-1 font-mono text-xs">Your POA text</code>
            <CopyButton text="Your POA text" />
          </CardContent>
        </Card>
      </Section>

      <Section title="Patterns - EmptyState">
        <Card>
          <CardContent className="pt-5">
            <EmptyState
              icon={Inbox}
              title="No evidence attached yet"
              description="Add a supplier invoice or other document. Evidence grounds the Plan of Action."
              action={
                <Button size="sm" variant="outline">
                  <FileText className="size-4" /> Add evidence
                </Button>
              }
            />
          </CardContent>
        </Card>
      </Section>

      <Section title="Patterns - Stepper">
        <Card>
          <CardContent className="pt-5">
            <Stepper
              steps={[
                { id: "root", label: "Root cause", state: "done" },
                { id: "timeline", label: "Timeline", state: "current" },
                { id: "evidence", label: "Evidence", state: "todo", skippedReason: undefined },
                { id: "review", label: "Review", state: "todo" },
              ]}
              currentId="timeline"
              progress={{ current: 2, total: 4 }}
            />
          </CardContent>
        </Card>
      </Section>

      <Section title="App surfaces - Dashboard head">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-border/70 bg-surface-1 p-4">
          <div>
            <h3 className="text-h2 text-foreground">{APP.dashboard.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{APP.dashboard.subtitle}</p>
          </div>
          <CaseStateBadge kind="POLICY" />
        </div>
      </Section>

      <Section title="App surfaces - Vault row">
        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-surface-2 text-muted-foreground">
              <FileText className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 truncate text-sm font-medium">
                <span>supplier-invoice.pdf</span>
                <EvidenceStatusBadge status="present" />
                <Badge variant="outline">{APP.vault.encryptedBadge}</Badge>
              </div>
              <div className="text-xs tabular-nums text-muted-foreground">
                application/pdf · 214 KB · Supplier invoice
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon-sm" variant="ghost" aria-label="View">
              <FileText className="size-4" />
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Composition">
        <Card>
          <CardHeader>
            <CardTitle>Result composition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <DeadlineChipList deadlines={sampleDeadlines.slice(0, 2)} />
            <Alert variant="info">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <AlertTitle>Severity-gated</AlertTitle>
                <AlertDescription>
                  Inauthentic-document cases are routed to professional help rather than a
                  self-serve draft.
                </AlertDescription>
              </div>
            </Alert>
            <div className="flex items-center gap-2">
              <VerifiedStamp checkedOn="2026-09-01" />
            </div>
            <Separator />
            <HonestExpectationsCard
              summary={GLOBAL_EXPECTATIONS.typicalNote}
              whatToDo={[
                "Read the deadlines and do-now list.",
                "Buy the Pass only when you are ready to draft a Plan of Action.",
              ]}
            />
          </CardContent>
        </Card>
      </Section>

      <Section title="AM-22 - Illustrations (light + dark)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="flex items-center justify-around gap-6 p-6">
            <ShieldCheckIllustration />
            <VaultDoorIllustration />
            <MagnifierDocumentIllustration />
          </Card>
          <Card className="flex items-center justify-around gap-6 rounded-xl bg-surface-inverse p-6 dark">
            <ShieldCheckIllustration />
            <VaultDoorIllustration />
            <MagnifierDocumentIllustration />
          </Card>
        </div>
      </Section>

      <Section title="AM-22 - Vault surface (light + dark, no obsidian override)">
        <div className="grid gap-4 sm:grid-cols-2">
          {[false, true].map((dark) => (
            <Card
              key={dark ? "dark" : "light"}
              className={
                dark ? "space-y-3 rounded-xl bg-surface-inverse p-6 dark" : "space-y-3 p-6"
              }
            >
              <div className="flex items-center gap-3">
                <VaultDoorIllustration size={40} />
                <div>
                  <p className="text-sm font-semibold text-foreground">Your encrypted evidence</p>
                  <p className="text-xs text-muted-foreground">
                    Files here are encrypted on your device.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-row border border-border/70 bg-surface-2 p-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-1 text-muted-foreground">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm">supplier-invoice_2026.pdf</span>
                    <Badge variant="outline">Encrypted</Badge>
                  </div>
                  <div className="font-mono text-xs tabular-nums text-muted-foreground">
                    application/pdf · 214 KB
                  </div>
                </div>
              </div>
              <p className="font-mono text-xs tabular-nums text-muted-foreground">
                Envelope v2 · AES-GCM 256-bit
              </p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="AM-22 - Accent word + badge sizes">
        <Card className="space-y-3 p-6">
          <p className="text-h3 text-foreground">
            Sign in to <AccentWord>continue</AccentWord>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Default pill</Badge>
            <Badge size="sm">Compact pill</Badge>
            <Badge variant="warning">Low severity</Badge>
            <Badge variant="secondary" size="sm">
              Policy violation
            </Badge>
          </div>
        </Card>
      </Section>

      {/* Facts ledger: built with the real core function so the contradiction path is exercised. */}
      <Section title="Facts ledger">
        <div className="grid gap-4 md:grid-cols-2">
          <FactsLedgerCard
            ledger={buildFactsLedger([
              {
                label: "supplier business name",
                value: "Acme Trading Ltd",
                source: { kind: "seller", field: "supplier business name" },
              },
              {
                label: "supplier business name",
                value: "Acme Ltd",
                source: { kind: "document", filename: "invoice-acme.pdf", field: "supplier" },
              },
              {
                label: "ASIN",
                value: "B08N5WRWNW",
                source: { kind: "notice", quote: "ASIN B08N5WRWNW", start: 0, end: 10 },
              },
            ])}
          />
          <FactsLedgerCard
            ledger={buildFactsLedger([
              {
                label: "Case ID",
                value: "8823471905",
                source: { kind: "notice", quote: "Case ID: 8823471905", start: 0, end: 10 },
              },
              {
                label: "Case ID",
                value: "8823471905",
                source: { kind: "seller", field: "Case ID" },
              },
            ])}
          />
        </div>
      </Section>

      {/* AA-41: the document check in each of its shapes. Needs a Pass and a real file in a vault
          to exercise for real, so this is where the rendering is reviewed without credentials. */}
      <Section title="Document check (AA-41)">
        <div className="grid gap-4 md:grid-cols-2">
          <DocumentCheckPanel busy={false} onCheck={() => {}} outcome={demoFieldsOutcome()} />
          <DocumentCheckPanel busy={false} onCheck={() => {}} outcome={demoImageOutcome()} />
          <DocumentCheckPanel
            busy={false}
            onCheck={() => {}}
            outcome={{
              kind: "unavailable",
              message: "We could not reach the checker. Your document and your case are unchanged.",
            }}
          />
          <DocumentCheckPanel busy onCheck={() => {}} outcome={null} />
        </div>
      </Section>

      {/* AA-40: the clock brief in each of its four states. The dashboard needs a signed-in vault,
          so this is where the card is reviewed without credentials. */}
      <Section title="Clock brief (AA-40)">
        <div className="grid gap-4 md:grid-cols-2">
          <ClockBriefCard brief={demoBrief([-4, 2])} />
          <ClockBriefCard brief={demoBrief([0])} />
          <ClockBriefCard brief={demoBrief([5, 12])} />
          <ClockBriefCard brief={demoBrief([])} />
        </div>
      </Section>
    </main>
  );
}

/** Uses the real `buildDocumentCheck`, so the gallery exercises the sanitiser rather than bypassing
 * it — note the deliberately non-compliant note on the second finding. */
function demoFieldsOutcome(): CheckOutcome {
  const fields = requirementsFor("INAUTHENTIC_DOCUMENTS").find(
    (r) => r.kind === "supplier_invoice",
  )!.fields;
  return {
    kind: "fields",
    result: buildDocumentCheck(
      "INAUTHENTIC_DOCUMENTS",
      "supplier_invoice",
      [
        {
          field: fields[0]!,
          status: "present",
          observed: "Acme Trading Ltd",
          note: "The supplier business name is printed at the top of page 1.",
        },
        {
          field: fields[2]!,
          status: "missing",
          note: "This invoice is authentic.",
        },
        {
          field: fields[3]!,
          status: "present",
          observed: "Invoice date: 03-Mar-2025",
          note: "The invoice date is printed under the supplier's address.",
        },
        {
          field: fields[4]!,
          status: "present",
          observed: "Blue widget, 10-pack x 200",
          note: "One line item is listed.",
        },
        {
          field: fields[5]!,
          status: "present",
          observed: "Qty 200",
          note: "The quantity is printed on the line item.",
        },
        // fields[1] (address) is left out on purpose: the gallery shows a field the reading skipped.
      ],
      { today: "2026-09-24", asins: ["B0ABCDEF12"], referenceIds: [] },
    ),
  };
}

function demoImageOutcome(): CheckOutcome {
  return {
    kind: "image",
    report: {
      looksReadable: false,
      checks: [
        {
          id: "resolution",
          status: "ok",
          label: "Size",
          detail: "2048 by 1536 pixels — large enough for small print to stay legible.",
        },
        {
          id: "sharpness",
          status: "warn",
          label: "Focus",
          detail:
            "The image looks soft or out of focus. Rest the document on a flat surface and retake it.",
        },
        {
          id: "exposure",
          status: "ok",
          label: "Lighting",
          detail: "Lighting looks even enough to read.",
        },
        {
          id: "framing",
          status: "ok",
          label: "Framing",
          detail: "All four edges appear to be inside the frame.",
        },
      ],
    },
  };
}

/** Builds a brief from day offsets, using the real core function rather than hand-written props. */
function demoBrief(offsets: number[]) {
  const now = Date.now();
  return buildClockBrief(
    offsets.map((days, i) => ({
      caseId: `demo-${i}`,
      kind: "POLICY" as const,
      state: "AWAITING" as const,
      reminderAt: new Date(now + days * 86_400_000).toISOString(),
      lastSeenAt: new Date(now - 5 * 86_400_000).toISOString(),
    })),
    now,
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
