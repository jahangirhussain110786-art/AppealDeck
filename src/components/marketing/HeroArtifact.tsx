import { ArrowRight, Check, FileText, FolderOpen, LockKeyhole } from "lucide-react";
import { Card } from "@/components/ui/card";
import { IconTile, VIEW_ICONS } from "@/components/workspace/WorkspaceVisuals";

/** Illustrative case, clearly labelled; these are not live customer records or metrics. */
export function HeroArtifact() {
  return (
    <figure
      className="relative min-w-0"
      aria-label="Example case workspace: notice saved, supplier invoice awaiting review, response and history available in the same case."
    >
      <div
        className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-primary/10 blur-3xl"
        aria-hidden
      />
      <Card className="overflow-hidden rounded-xl shadow-elevated" aria-hidden="true">
        <div className="workspace-hero flex items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
          <span className="text-eyebrow uppercase text-muted-foreground">Example case</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LockKeyhole className="size-3.5" />
            Encrypted on device
          </span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <IconTile icon={FolderOpen} tone="info" />
            <div>
              <p className="text-xs text-muted-foreground">Amazon US · Request review</p>
              <p className="mt-1 text-lg font-semibold text-foreground">Your case, connected.</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-surface-2 p-1">
            {Object.entries(VIEW_ICONS).map(([name, Icon]) => (
              <div
                key={name}
                className={`flex flex-col items-center gap-1.5 rounded-md px-1 py-2.5 text-xs capitalize ${name === "evidence" ? "bg-card font-medium text-primary shadow-card" : "text-muted-foreground"}`}
              >
                <Icon className="size-4" />
                {name}
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Check className="size-4 text-primary" />
              Notice saved
            </div>
            <span className="text-xs text-muted-foreground">Ready to review</span>
          </div>
          <div className="mt-3 rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <IconTile icon={FileText} tone="warning" />
              <div>
                <p className="text-sm font-semibold text-foreground">Supplier invoice</p>
                <p className="mt-1 text-xs text-muted-foreground">Requested in the notice</p>
              </div>
            </div>
            <div className="my-4 flex items-center gap-2 rounded-md bg-surface-2 p-3 text-xs text-muted-foreground">
              <FileText className="size-4" />
              supplier-invoice.pdf
              <span className="ml-auto rounded-full bg-warning/10 px-2 py-1 text-foreground">
                Needs review
              </span>
            </div>
            <p className="text-xs font-medium text-foreground">Next action</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check the original and record what it supports.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
            Evidence → response → history
            <ArrowRight className="ml-auto size-4" />
          </div>
        </div>
      </Card>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">
        Illustrative workspace · You review and submit
      </figcaption>
    </figure>
  );
}
