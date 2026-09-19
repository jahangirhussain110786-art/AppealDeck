"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SHARED } from "@/content/shared";
import { List, ChevronDown } from "lucide-react";

export function LegalToc({ sections }: { sections: { id: string; title: string }[] }) {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const links = (
    <ul className="space-y-1">
      {sections.map((s, index) => {
        const active = s.id === activeId;
        return (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={active ? "location" : undefined}
              className={cn(
                "flex min-h-10 items-start gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <span className="pt-0.5 font-mono text-xs text-muted-foreground" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              {s.title}
            </a>
          </li>
        );
      })}
    </ul>
  );
  return (
    <nav className="lg:sticky lg:top-20" aria-label="On-page">
      <details className="group rounded-xl border border-border/80 bg-card p-4 lg:hidden">
        <summary className="flex min-h-6 cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <List className="size-4 text-primary" aria-hidden /> {SHARED.tocHeading}
          <ChevronDown className="ml-auto size-4 group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-3">{links}</div>
      </details>
      <div className="hidden space-y-3 rounded-xl border border-border/80 bg-card p-3 lg:block">
        <p className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <List className="size-4" aria-hidden />
          {SHARED.tocHeading}
        </p>
        {links}
      </div>
    </nav>
  );
}
