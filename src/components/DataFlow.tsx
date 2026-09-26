import { ArrowRight, HardDrive, Laptop, Store, X } from "lucide-react";
import { SURFACES } from "@/content/surfaces";

/**
 * Where a seller's case goes, drawn rather than described (v5, 26 Sep 2026). A summary of the
 * privacy policy it sits above: the device holds the only copy, the server reads and keeps
 * nothing, and there is no connection to the seller's Amazon account at all.
 */
export function DataFlow() {
  const d = SURFACES.dataFlow;
  const node = "flex flex-col items-center gap-2.5 rounded-[20px] p-6 text-center";
  return (
    <section aria-labelledby="data-flow" id="data-flow" className="space-y-5">
      <h2 id="data-flow" className="text-xl font-semibold tracking-tight text-foreground">
        {d.title}
      </h2>
      <div className="grid items-center gap-3 lg:grid-cols-[1fr_8rem_1fr_8rem_1fr]">
        <div className={`${node} border-2 border-foreground bg-card shadow-lift`}>
          <span className="grid size-12 place-items-center rounded-2xl bg-success/10">
            <Laptop aria-hidden className="size-6 text-success" />
          </span>
          <strong className="text-lg text-foreground">{d.device.title}</strong>
          <span className="text-sm text-muted-foreground">{d.device.body}</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center text-xs leading-snug text-muted-foreground">
          <ArrowRight aria-hidden className="size-5 rotate-90 text-foreground lg:rotate-0" />
          {d.toServer}
        </div>
        <div className={`${node} border border-border/80 bg-card shadow-lift`}>
          <span className="grid size-12 place-items-center rounded-2xl bg-muted">
            <HardDrive aria-hidden className="size-6 text-foreground" />
          </span>
          <strong className="text-lg text-foreground">{d.server.title}</strong>
          <span className="text-sm text-muted-foreground">{d.server.body}</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center text-xs font-semibold text-destructive">
          <X aria-hidden className="size-5" />
          {d.never}
        </div>
        <div className={`${node} border-[1.5px] border-dashed border-input bg-surface-2`}>
          <span className="grid size-12 place-items-center rounded-2xl bg-card">
            <Store aria-hidden className="size-6 text-muted-foreground" />
          </span>
          <strong className="text-lg text-foreground">{d.amazon.title}</strong>
          <span className="text-sm text-muted-foreground">{d.amazon.body}</span>
        </div>
      </div>
    </section>
  );
}
