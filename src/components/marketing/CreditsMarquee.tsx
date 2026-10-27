"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";
import { CREDITS_LABELS } from "@/content/credits";
import { shouldDrift } from "@/lib/creditsMotion";
import { cn } from "@/lib/utils";

/**
 * The moving row of tool names on the home page (27 Oct 2026).
 *
 * It follows the announcement ticker's rules (AM-30) rather than inventing new ones: two copies of
 * the list scroll by half their width so the loop has no seam, the second copy is hidden from
 * assistive technology so each name is announced once, and anything moving on its own can be paused
 * (WCAG 2.2.2).
 *
 * The difference is when it starts. The row is still until it scrolls into view, stops when it
 * leaves or when the tab goes to the background, and a press of pause survives all of that. Motion
 * belongs to attention, not to page load — which is also what keeps it inside the motion rules in
 * 06-PREMIUM-UI-UX-SPEC §5.
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

// One line, at wordmark size: bigger than body text, heavier, tight tracking. The names carry the
// row on their own because there is no logo artwork to carry it (see ThanksBand).
const NAME_CLASS =
  "flex shrink-0 items-center whitespace-nowrap text-[1.375rem] font-semibold tracking-[-0.025em] text-foreground sm:text-[1.75rem]";

function Names({ names, hidden }: { names: readonly string[]; hidden?: boolean }) {
  return (
    <ul className="flex items-center" aria-hidden={hidden || undefined}>
      {names.map((name) => (
        <li key={name} className={NAME_CLASS}>
          <span aria-hidden className="mx-7 size-1.5 shrink-0 rounded-full bg-white/25 sm:mx-10" />
          {name}
        </li>
      ))}
    </ul>
  );
}

export function CreditsMarquee({
  names,
  seconds = 110,
}: {
  names: readonly string[];
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

  const drifting = shouldDrift({ visible, documentHidden, paused: paused || held, reduced });

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
      {reduced ? (
        // Reduced motion: the same names, readable at once, nothing moving.
        <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 sm:gap-x-10">
          {names.map((name) => (
            <li
              key={name}
              className="text-[1.375rem] font-semibold tracking-[-0.025em] text-foreground sm:text-[1.75rem]"
            >
              {name}
            </li>
          ))}
        </ul>
      ) : (
        <div className="credits-window overflow-hidden">
          <div
            className="credits-track flex w-max items-center"
            data-paused={drifting ? undefined : "true"}
            style={{ ["--credits-duration" as string]: `${seconds}s` }}
          >
            <Names names={names} />
            <Names names={names} hidden />
          </div>
        </div>
      )}

      {!reduced && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            aria-label={paused ? CREDITS_LABELS.play : CREDITS_LABELS.pause}
            aria-pressed={paused}
            onClick={() => setPaused((p) => !p)}
            className={cn(
              "grid size-8 place-items-center rounded-md text-white/50 transition-colors",
              "hover:bg-white/[0.06] hover:text-white/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            )}
          >
            {paused ? (
              <Play className="size-3.5" aria-hidden />
            ) : (
              <Pause className="size-3.5" aria-hidden />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
