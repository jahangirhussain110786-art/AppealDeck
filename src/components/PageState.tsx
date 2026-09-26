import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";

export function PageState({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="workspace-hero mx-auto my-8 w-full max-w-tool rounded-xl border border-border/80 p-6 sm:my-14 sm:p-10">
      <IconTile icon={icon} tone="info" />
      <p className="mt-6 text-eyebrow text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-2 tracking-[-0.03em] text-h2 font-semibold text-foreground">{title}</h1>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">{children}</div>
    </section>
  );
}
