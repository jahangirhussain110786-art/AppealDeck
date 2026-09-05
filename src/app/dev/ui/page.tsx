import { notFound } from "next/navigation";
import { AlertTriangle, FileText, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/EmptyState";
import { CopyButton } from "@/components/CopyButton";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CaseStateBadge } from "@/components/CaseStateBadge";
import { EvidenceStatusBadge } from "@/components/EvidenceStatusBadge";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { DeadlineChipList } from "@/components/DeadlineChip";
import { LocalFirstBadge } from "@/components/LocalFirstBadge";
import { VerifiedStamp } from "@/components/VerifiedStamp";
import { Stepper } from "@/components/Stepper";
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

export const dynamic = "force-dynamic";

export default function DevUiGallery() {
  if (process.env.NODE_ENV === "production") notFound();

  const sampleDeadlines = [
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
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12">
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

      <Section title="Buttons">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-5">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button disabled>Disabled</Button>
          </CardContent>
        </Card>
      </Section>

      <Section title="Badges">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-5">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <SeverityBadge severity="high" />
            <SeverityBadge severity="medium" />
            <SeverityBadge severity="low" />
            <CaseStateBadge kind="POLICY" />
            <CaseStateBadge kind="INAUTHENTIC_DOCUMENTS" />
            <EvidenceStatusBadge status="present" />
            <EvidenceStatusBadge status="missing" />
            <EvidenceStatusBadge status="pending" />
            <LocalFirstBadge />
            <VerifiedStamp checkedOn="2026-09-01" />
          </CardContent>
        </Card>
      </Section>

      <Section title="Alerts">
        <div className="grid gap-3">
          <Alert variant="info">
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>Decode runs locally. No notice text is uploaded.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Funds review is a checkpoint, not an automatic release.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Severity-gated</AlertTitle>
            <AlertDescription>
              Inauthentic-document cases without a verifiable supplier invoice are routed to
              professional help.
            </AlertDescription>
          </Alert>
          <Alert variant="success">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Plan of Action copied to clipboard.</AlertDescription>
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

      <Section title="Accordion">
        <Card>
          <CardContent className="pt-5">
            <Accordion type="single" collapsible>
              <AccordionItem value="a">
                <AccordionTrigger>What is local-first?</AccordionTrigger>
                <AccordionContent>Notice text is processed in your browser.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="b">
                <AccordionTrigger>Do you submit to Amazon?</AccordionTrigger>
                <AccordionContent>
                  No. You submit the appeal yourself in Seller Central.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </Section>

      <Section title="Form controls">
        <Card>
          <CardContent className="space-y-3 pt-5">
            <div className="space-y-1.5">
              <Label htmlFor="email-demo">Email</Label>
              <Input id="email-demo" type="email" placeholder="you@business.com" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="consent-demo" />
              <Label htmlFor="consent-demo">I consent to immediate delivery.</Label>
            </div>
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

      <Section title="Patterns - HonestExpectationsCard">
        <HonestExpectationsCard
          summary="We decode the notice in your browser. We draft a Plan of Action grounded in the notice and your evidence. We do not submit to Amazon on your behalf."
          whatToDo={[
            "Read the plain-English summary and the deadlines.",
            "Decide whether to act on the do-now list yourself or buy the Appeal Pass.",
            "If you buy, the Pass drafts your POA; you edit and submit it yourself.",
          ]}
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
                  <FileText className="h-4 w-4" /> Add evidence
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
              progress={{ current: 2, total: 4, pendingEvidence: 1 }}
            />
          </CardContent>
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
              <AlertTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Severity-gated
              </AlertTitle>
              <AlertDescription>
                Inauthentic-document cases are routed to professional help rather than a self-serve
                draft.
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              <LocalFirstBadge />
              <VerifiedStamp checkedOn="2026-09-01" />
            </div>
            <Separator />
            <HonestExpectationsCard
              summary="We help you submit a stronger, honest appeal faster. We do not promise reinstatement."
              whatToDo={[
                "Read the deadlines and do-now list.",
                "Buy the Pass only when you are ready to draft a Plan of Action.",
              ]}
            />
          </CardContent>
        </Card>
      </Section>
    </main>
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
