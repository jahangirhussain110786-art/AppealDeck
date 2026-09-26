"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One large product visual, switched by a list of buttons (v5, 26 Sep 2026; the pattern Mercury
 * uses in place of a stack of feature cards). The buttons are real buttons with `aria-pressed`,
 * so the state is announced. `panels[i]` is shown while `items[i]` is pressed.
 */
export function FeatureSwitcher({
  label,
  items,
  panels,
}: {
  label: string;
  items: ReadonlyArray<{ title: string; body: string }>;
  panels: ReactNode[];
}) {
  const [active, setActive] = useState(0);
  return (
    <div className="mt-14 grid items-center gap-8 lg:grid-cols-[380px_1fr] lg:gap-14">
      <div role="group" aria-label={label} className="flex flex-col">
        {items.map((item, i) => {
          const on = i === active;
          return (
            <button
              key={item.title}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(i)}
              className={cn(
                "grid grid-cols-[36px_1fr] gap-3.5 border-t border-border py-5 text-left last:border-b focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="pt-1 font-mono text-[13px]">0{i + 1}</span>
              <span>
                <strong
                  className={cn(
                    "block text-xl font-semibold tracking-tight",
                    on ? "text-foreground" : "text-foreground/80",
                  )}
                >
                  {item.title}
                </strong>
                {on && (
                  <span className="mt-1.5 block text-[15.5px] leading-relaxed text-foreground/80">
                    {item.body}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="warm-stage relative flex min-h-[420px] flex-col justify-center overflow-hidden rounded-[28px] p-5 sm:p-10 lg:min-h-[500px]">
        <div key={active} className="panel-rise w-full">
          {panels[active]}
        </div>
      </div>
    </div>
  );
}
