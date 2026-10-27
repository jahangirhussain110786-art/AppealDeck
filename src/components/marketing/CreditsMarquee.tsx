"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CREDITS_LABELS, type CreditFace, type CreditName } from "@/content/credits";
import { shouldDrift } from "@/lib/creditsMotion";
import { cn } from "@/lib/utils";

/**
 * The moving row of tool marks and names on the home page (27 Oct 2026).
 *
 * Two copies of the list scroll by half their width so the loop has no seam, and the second copy is
 * hidden from assistive technology so each name is announced once. The row is still until it scrolls
 * into view and stops when it leaves or the tab goes to the background — motion belongs to
 * attention, not to page load (06-PREMIUM-UI-UX-SPEC §5).
 *
 * The row moves for every reader regardless of the OS animation setting: on the founder's machine
 * Windows reports animations off, yet every strip he pointed at moves anyway (27 Oct 2026). There is
 * no pause button — the pointer is the pause: hovering the row (or tabbing to it) holds it still so
 * a name can be read, and moving away continues the drift.
 */

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
          className="flex shrink-0 items-center gap-3.5 whitespace-nowrap sm:gap-5"
        >
          <span aria-hidden className="mx-7 size-2 shrink-0 rounded-full bg-white/20 sm:mx-10" />
          {entry.logo && (
            <Image
              src={entry.logo}
              alt=""
              aria-hidden
              width={40}
              height={40}
              unoptimized
              loading="eager"
              className="size-8 shrink-0 opacity-90 sm:size-10"
            />
          )}
          <span
            className={cn(
              "text-[2rem] font-semibold leading-none tracking-[-0.025em] text-foreground sm:text-[2.5rem]",
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
  const [visible, setVisible] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(false);
  const [held, setHeld] = useState(false); // pointer or keyboard focus on the row

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

  const drifting = shouldDrift({ visible, documentHidden, paused: held });

  return (
    <div
      ref={wrap}
      role="group"
      aria-label={CREDITS_LABELS.region}
      tabIndex={0}
      className="relative rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
      }}
    >
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
    </div>
  );
}
