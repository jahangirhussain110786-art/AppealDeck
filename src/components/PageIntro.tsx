import type { ReactNode } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";

/**
 * The header card of an app page (v5, 26 Sep 2026): the navy stage with a soft orange glow, the
 * page's title in the display face, optional actions, and optionally one illustration that
 * explains the page (the vault's locked folder). `dark` flips every token inside it, so badges,
 * outline buttons and icon tiles read on navy in both themes.
 */
export function PageIntro({
  icon,
  eyebrow,
  title,
  description,
  actions,
  illustration,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  /** A public path under /illustrations, with the alt text that says what it shows. */
  illustration?: { src: string; alt: string };
}) {
  return (
    <header className="stage dark flex flex-wrap items-center justify-between gap-6 rounded-[22px] px-6 py-6 text-foreground shadow-lift sm:px-8 sm:py-7">
      <div className="flex min-w-0 items-center gap-5">
        {illustration ? (
          <Image
            src={illustration.src}
            alt={illustration.alt}
            width={120}
            height={100}
            className="hidden h-auto w-28 shrink-0 drop-shadow-[0_16px_30px_rgba(0,0,0,0.45)] sm:block"
            unoptimized
          />
        ) : (
          <IconTile icon={icon} className="hidden sm:inline-flex" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">{eyebrow}</p>
          <h1 className="mt-1 text-balance text-[clamp(1.6rem,1.2rem+1.4vw,2.2rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-foreground">
            {title}
          </h1>
          <p className="mt-2 max-w-prose text-[0.95rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
