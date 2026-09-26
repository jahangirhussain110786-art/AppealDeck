import { Clock, FileText } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/lib/utils";

/**
 * A still of the case workspace with sample data, for the home page and the sign-in split screen
 * (26 Sep 2026, replacing HeroArtifact). Every row shows a thing the real workspace does: a
 * requirement with its status, where it came from, a linked file, and the document check that
 * quotes the file. Nothing here is a live record and the caption says so where it is shown.
 */
export function WorkspacePreview({ className }: { className?: string }) {
  return (
    <figure
      aria-label="Example case workspace with sample data: the records a case needs, each with a status and a source, beside the check of a linked invoice."
      className={cn("min-w-0", className)}
    >
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-border bg-card shadow-elevated"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-2/60 px-4 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <LogoMark size={18} />
            <span className="font-medium text-foreground">Inauthentic item · US marketplace</span>
            <span className="hidden font-mono sm:inline">case_7f3a</span>
          </span>
          <span className="flex items-center gap-1.5 tabular-nums text-warning">
            <Clock className="size-3.5" />
            Reply due Mon 28 Sep
          </span>
        </div>
        <div className="grid md:grid-cols-[1.4fr_1fr]">
          <div className="border-b border-border p-4 md:border-b-0 md:border-r">
            <p className="text-eyebrow uppercase text-muted-foreground">What this case needs</p>
            <ol className="hairline-rows mt-3 text-sm">
              <Row
                label="Supplier invoice, within 365 days"
                file="inv_0412.pdf"
                status="Checked"
                tone="success"
              />
              <Row label="Root cause, in your own words" status="In progress" tone="info" />
              <Row label="Preventive steps, each dated" status="Not started" tone="muted" />
              <Row
                label="Supplier contact and order history"
                note="We added this"
                status="Not started"
                tone="muted"
              />
            </ol>
          </div>
          <div className="p-4">
            <p className="text-eyebrow uppercase text-muted-foreground">Invoice check</p>
            <p className="mt-2 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <FileText className="size-3.5" />
              inv_0412.pdf
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <Fact k="Invoice date" v="14 Mar 2026" />
              <Fact k="ASIN named" v="Matches the notice" />
              <Fact k="Buyer name" v="Matches your business" />
            </dl>
            <p className="mt-3 rounded-md border border-border bg-surface-2/60 p-3 text-xs leading-relaxed text-muted-foreground">
              Quoted from the document:{" "}
              <span className="font-accent text-sm italic text-foreground">
                “Invoice No. 0412, issued 14 March 2026”
              </span>
            </p>
          </div>
        </div>
      </div>
    </figure>
  );
}

const TONES = {
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  muted: "bg-muted text-muted-foreground",
} as const;

function Row({
  label,
  file,
  note,
  status,
  tone,
}: {
  label: string;
  file?: string;
  note?: string;
  status: string;
  tone: keyof typeof TONES;
}) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="min-w-0 flex-1 truncate text-foreground">{label}</span>
      {file && (
        <span className="hidden font-mono text-xs text-muted-foreground lg:inline">{file}</span>
      )}
      {note && <span className="hidden text-xs text-muted-foreground lg:inline">{note}</span>}
      <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-medium", TONES[tone])}>
        {status}
      </span>
    </li>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right tabular-nums text-foreground">{v}</dd>
    </div>
  );
}
