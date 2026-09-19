import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";

export function PageIntro({
  icon,
  eyebrow,
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="workspace-hero flex flex-wrap items-center justify-between gap-5 rounded-xl border border-border/80 p-5 sm:p-6">
      <div className="flex min-w-0 items-start gap-4">
        <IconTile icon={icon} className="hidden sm:inline-flex" />
        <div className="min-w-0">
          <p className="text-eyebrow uppercase text-primary">{eyebrow}</p>
          <h1 className="mt-1 font-accent text-h2 font-medium text-foreground">{title}</h1>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
