"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SHARED } from "@/content/shared";

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

  return (
    <nav className="hidden lg:block" aria-label="On-page">
      <div className="sticky top-20 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{SHARED.tocHeading}</p>
        <ul className="space-y-1.5">
          {sections.map((s) => {
            const active = s.id === activeId;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "block border-l-2 pl-3 text-sm transition-colors",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
