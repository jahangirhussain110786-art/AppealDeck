"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { CREDITS_LABELS, type CreditFace, type CreditName } from "@/content/credits";
import { shouldDrift } from "@/lib/creditsMotion";
import { cn } from "@/lib/utils";

/**
 * The moving row of tool marks and names on the home page (27 Oct 2026).
 *
 * It follows the announcement ticker's rules (AM-30) rather than inventing new ones: two copies of
 * the list scroll by half their width so the loop has no seam, the second copy is hidden from
 * assistive technology so each name is announced once, and anything moving on its own can be paused
 * (WCAG 2.2.2). The row is still until it scrolls into view, stops when it leaves or when the tab
 * goes to the background, and a press of pause survives all of that — motion belongs to attention,
 * not to page load (06-PREMIUM-UI-UX-SPEC §5).
 *
 * Reduced motion is honoured, but it is one row either way. With the preference set the strip sits
 * still and scrolls sideways so every name stays reachable, and the button starts the drift on
 * request — motion the reader asked for is not the motion the preference is about.
 */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function readReducedMotion() {
  return window.matchMedia(REDUCED_QUERY).matches;
}

const FACE: Record<CreditFace, string> = {
  serif: "[font-family:var(--font-credit-serif)] tracking-[-0.01em]",
  grotesque: "[font-family:var(--font-credit-grotesque)] tracking-[-0.035em]",
  humanist: "[font-family:var(--font-credit-humanist)] tracking-[-0.02em]",
};

function Names({ names, hidden }: { names: readonly CreditName[]; hidden?: boolean }) {
  return (
    <ul className="flex items-center" aria-hidden={hidden || undefined}>
      {names.map((entry) => (
        <li
          key={entry.name}
          className="flex shrink-0 items-center gap-3 whitespace-nowrap sm:gap-4"
        >
          <span aria-hidden className="mx-6 size-1.5 shrink-0 rounded-full bg-white/20 sm:mx-9" />
          {entry.logo && (
            <Image
              src={entry.logo}
              alt=""
              aria-hidden
              width={32}
              height={32}
              unoptimized
              loading="eager"
              className="size-6 shrink-0 opacity-90 sm:size-8"
            />
          )}
          <span
            className={cn(
              "text-[1.625rem] font-semibold leading-none tracking-[-0.025em] text-foreground sm:text-[2rem]",
              entry.face && FACE[entry.face],
            )}
          >
            {entry.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CreditsMarquee({
  names,
  seconds = 110,
}: {
  names: readonly CreditName[];
  seconds?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  // Server value false, as in AnnouncementBar: reading the real setting during hydration made the
  // server and client disagree about whether to render the pause button.
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false);
  const [visible, setVisible] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(false);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false); // pointer or focus on the row
  const [optIn, setOptIn] = useState(false); // the reader asked for motion despite the preference

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // No observer (very old browser): show it moving rather than stuck, but not from inside the
      // effect body, which would be a cascading render.
      const first = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(first);
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setDocumentHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const moving = !reduced || optIn;
  const drifting = shouldDrift({
    visible,
    documentHidden,
    paused: paused || held,
    reduced: !moving,
  });

  return (
    <div
      ref={wrap}
      role="group"
      aria-label={CREDITS_LABELS.region}
      className="relative"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
      }}
    >
      {moving ? (
        <div className="credits-window overflow-hidden" data-motion="on">
          <div
            className="credits-track flex w-max items-center"
            data-paused={drifting ? undefined : "true"}
            style={{ ["--credits-duration" as string]: `${seconds}s` }}
          >
            <Names names={names} />
            <Names names={names} hidden />
          </div>
        </div>
      ) : (
        // Reduced motion: one row, still, scrollable, with the same marks and names.
        <div className="credits-window overflow-x-auto" data-motion="off">
          <Names names={names} />
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          aria-label={!moving || paused ? CREDITS_LABELS.play : CREDITS_LABELS.pause}
          aria-pressed={moving ? paused : false}
          onClick={() => {
            if (!moving) {
              setOptIn(true);
              return;
            }
            setPaused((p) => !p);
          }}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-white/45 transition-colors",
            "hover:bg-white/[0.06] hover:text-white/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "[@media(pointer:coarse)]:h-10",
          )}
        >
          {!moving || paused ? (
            <Play className="size-3.5" aria-hidden />
          ) : (
            <Pause className="size-3.5" aria-hidden />
          )}
          <span aria-hidden>
            {!moving || paused ? CREDITS_LABELS.playShort : CREDITS_LABELS.pauseShort}
          </span>
        </button>
      </div>
    </div>
  );
}
