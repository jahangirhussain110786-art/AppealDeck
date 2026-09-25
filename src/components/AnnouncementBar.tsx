"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, m, useReducedMotion, type TargetAndTransition } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import {
  ANNOUNCEMENT_BAR,
  type Announcement,
  type AnnouncementEffect,
} from "@/content/announcements";
import { cn } from "@/lib/utils";

/**
 * The thin navy bar above the header on the public pages (AM-30, 25 Sep 2026).
 *
 * Three modes, chosen in `src/content/announcements.ts`: one message standing still, one message
 * at a time rotating with a fade or a slide, or a continuous ticker. Whatever the mode:
 * - anything that moves on its own can be paused (WCAG 2.2.2), and pauses while the pointer or
 *   keyboard focus is on it, so a seller reaching for a link does not have it moved away;
 * - with reduced motion requested, nothing moves on its own; the seller steps through by hand;
 * - dismissing it is remembered per set of messages, so a new announcement shows again.
 *
 * Deliberately not on the signed-in pages: a seller working on their case is not shown promotions.
 */

const STORAGE_KEY = "appealdeck:announcements-dismissed";
const VERSION = ANNOUNCEMENT_BAR.items.map((i) => i.id).join("|");

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === VERSION;
  } catch {
    // Storage unavailable (private window, blocked site data): the bar simply shows.
    return false;
  }
}

function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const EFFECTS: Record<
  AnnouncementEffect,
  { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }
> = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  "slide-up": {
    initial: { opacity: 0, y: "70%" },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: "-70%" },
  },
  "slide-left": {
    initial: { opacity: 0, x: 32 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -32 },
  },
};

function Message({ item, inert = false }: { item: Announcement; inert?: boolean }) {
  const body = (
    <>
      {item.tag && (
        <span className="mr-2 shrink-0 font-semibold uppercase tracking-wide text-announce-accent">
          {item.tag}
        </span>
      )}
      <span className="truncate">{item.text}</span>
      {item.href && item.linkLabel && (
        <span className="ml-2 hidden shrink-0 items-center gap-1 font-medium underline decoration-announce-foreground/40 underline-offset-4 group-hover:decoration-announce-foreground sm:inline-flex">
          {item.linkLabel}
          <ArrowRight className="size-3.5" aria-hidden />
        </span>
      )}
    </>
  );
  if (!item.href) return <span className="flex min-w-0 items-center">{body}</span>;
  return (
    <Link
      href={item.href}
      tabIndex={inert ? -1 : undefined}
      className="group flex min-w-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-announce-accent"
    >
      {body}
    </Link>
  );
}

function IconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md text-announce-foreground/80 transition-colors hover:bg-announce-foreground/10 hover:text-announce-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-announce-accent",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function AnnouncementBar() {
  const { items, labels, intervalMs, tickerSeconds } = ANNOUNCEMENT_BAR;
  const reduced = useReducedMotion() ?? false;
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false); // pointer or focus inside

  // With reduced motion a ticker or rotation becomes a message the seller steps through by hand.
  const mode =
    ANNOUNCEMENT_BAR.mode === "static" || items.length < 2
      ? "static"
      : reduced
        ? "manual"
        : ANNOUNCEMENT_BAR.mode;
  const moving = (mode === "rotate" || mode === "ticker") && !paused;

  const dismissedBefore = useSyncExternalStore(subscribeStorage, readDismissed, () => false);

  const step = useCallback(
    (by: number) => setIndex((i) => (i + by + items.length) % items.length),
    [items.length],
  );

  useEffect(() => {
    if (mode !== "rotate" || paused || held) return;
    const timer = window.setInterval(() => step(1), intervalMs);
    return () => window.clearInterval(timer);
  }, [mode, paused, held, intervalMs, step]);

  if (!ANNOUNCEMENT_BAR.enabled || items.length === 0 || dismissed || dismissedBefore) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, VERSION);
    } catch {
      // Not remembered; it will show again next visit.
    }
  };

  const current = items[index] as Announcement;
  const effect = EFFECTS[current.effect ?? ANNOUNCEMENT_BAR.effect];

  return (
    <section
      aria-label={labels.region}
      data-no-print
      className="bg-announce text-xs text-announce-foreground sm:text-[0.8125rem]"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
      }}
    >
      <div className="mx-auto flex h-9 max-w-marketing items-center gap-2 px-4 sm:px-6">
        {mode === "manual" || mode === "rotate" ? (
          <IconButton label={labels.previous} onClick={() => step(-1)} className="hidden sm:grid">
            <ChevronLeft className="size-4" aria-hidden />
          </IconButton>
        ) : (
          <span className="hidden w-7 sm:block" aria-hidden />
        )}

        <div
          className="relative flex h-full min-w-0 flex-1 items-center justify-center overflow-hidden"
          aria-live={mode === "manual" ? "polite" : "off"}
        >
          {mode === "ticker" ? (
            <div
              className="announce-ticker flex w-max items-center"
              data-paused={paused || held ? "true" : undefined}
              style={{ ["--ticker-duration" as string]: `${tickerSeconds}s` }}
            >
              {[0, 1].map((copy) => (
                <div key={copy} className="flex items-center" aria-hidden={copy === 1 || undefined}>
                  {items.map((item) => (
                    <span key={item.id} className="flex items-center px-8">
                      <Message item={item} inert={copy === 1} />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ) : mode === "static" ? (
            <Message item={items[0] as Announcement} />
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              <m.div
                key={current.id}
                className="absolute inset-0 flex items-center justify-center"
                initial={effect.initial}
                animate={effect.animate}
                exit={effect.exit}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                <Message item={current} />
              </m.div>
            </AnimatePresence>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {mode === "manual" || mode === "rotate" ? (
            <IconButton label={labels.next} onClick={() => step(1)} className="hidden sm:grid">
              <ChevronRight className="size-4" aria-hidden />
            </IconButton>
          ) : null}
          {(mode === "rotate" || mode === "ticker") && (
            <IconButton
              label={moving ? labels.pause : labels.play}
              onClick={() => setPaused((p) => !p)}
            >
              {moving ? (
                <Pause className="size-3.5" aria-hidden />
              ) : (
                <Play className="size-3.5" aria-hidden />
              )}
            </IconButton>
          )}
          <IconButton label={labels.dismiss} onClick={dismiss}>
            <X className="size-3.5" aria-hidden />
          </IconButton>
        </div>
      </div>
    </section>
  );
}
