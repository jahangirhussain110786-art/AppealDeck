"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { GUIDE, GUIDE_ASPECT, GUIDE_WIDTHS, guideFor, type GuideMood } from "@/content/guide";
import { Dex3D } from "@/components/dex3d/Dex3D";

const STORAGE_KEY = "appealdeck-guide";

function readHidden(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "hidden";
  } catch {
    return false;
  }
}
const listeners = new Set<() => void>();
function writeHidden(hidden: boolean) {
  try {
    if (hidden) window.localStorage.setItem(STORAGE_KEY, "hidden");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* A private window may refuse storage; Dex then simply comes back next visit. */
  }
  listeners.forEach((l) => l());
}
function subscribeHidden(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}
const noSubscribe = () => () => {};

const SMALL_BUTTON =
  "flex size-7 items-center justify-center rounded-full border bg-card/90 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** 3D is for visitors who have done something on the page, and never in automated browsers (unless asked). */
function wants3d(): boolean {
  try {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (nav.connection?.saveData) return false;
    if (nav.webdriver) return window.localStorage.getItem("appealdeck-dex3d") === "on";
  } catch {
    /* fall through: the picture is always there */
  }
  return true;
}

/** 3D was asked for by hand (testing): do not fall back to the picture for being slow. */
function forced3d(): boolean {
  try {
    return window.localStorage.getItem("appealdeck-dex3d") === "on";
  } catch {
    return false;
  }
}

const src = (mood: GuideMood, w: number) => `/mascot/dex-${mood}-${w}.webp`;
const srcSet = (mood: GuideMood) => GUIDE_WIDTHS.map((w) => `${src(mood, w)} ${w}w`).join(", ");

/**
 * Dex, the guide in the corner of every page.
 *
 * One fixed line and one mood per page (`src/content/guide.ts`). He is not a chat window. He turns to
 * look at the pointer (a small 3D tilt), bobs, hops now and then, and can be hidden; the choice is kept.
 * Everything that moves stops for people who ask for reduced motion.
 */
export function GuideDex() {
  const pathname = usePathname();
  const entry = guideFor(pathname);
  // False while rendering on the server and during hydration, true after: Dex only appears in the browser.
  const ready = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const hidden = useSyncExternalStore(subscribeHidden, readHidden, () => false);
  // The line is open on a new page until its timer runs out; a tap on Dex opens or closes it.
  const [tip, setTip] = useState<{ path: string; open: boolean } | null>(null);
  const bubble = tip && tip.path === pathname ? tip.open : true;
  const [hop, setHop] = useState(false);
  // 3D: asked for after the visitor's first move, drawn when ready, and the picture stays as the fallback.
  const [want3d, setWant3d] = useState(false);
  const [ready3d, setReady3d] = useState(false);
  const [failed3d, setFailed3d] = useState(false);
  const live3d = want3d && ready3d && !failed3d;
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  // The line shows for a few seconds on each new page.
  useEffect(() => {
    const t = window.setTimeout(() => setTip({ path: pathname, open: false }), 7000);
    return () => window.clearTimeout(t);
  }, [pathname]);

  const active = ready && !hidden && entry !== null;

  // Wake the 3D Dex on the first sign of life from the visitor: it is a large download.
  useEffect(() => {
    if (!active || want3d || !wants3d()) return;
    const go = () => setWant3d(true);
    const events = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;
    for (const e of events) window.addEventListener(e, go, { once: true, passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, go);
    };
  }, [active, want3d]);

  // Turn toward the pointer; when it has been still, sway slowly so he never freezes.
  useEffect(() => {
    if (!active || live3d || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let last = 0;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 380));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 380));
      last = performance.now();
    };
    const tick = (now: number) => {
      const still = now - last > 4000;
      const t = now / 1000;
      const gx = still ? Math.sin(t * 0.6) * 0.5 : tx;
      const gy = still ? Math.sin(t * 0.45) * 0.18 : ty;
      cx += (gx - cx) * 0.08;
      cy += (gy - cy) * 0.08;
      if (stage.current)
        stage.current.style.transform = `perspective(520px) rotateY(${(cx * 18).toFixed(2)}deg) rotateX(${(-cy * 12).toFixed(2)}deg)`;
      raf = window.requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(raf);
    };
  }, [active, live3d]);

  // A small hop every so often.
  useEffect(() => {
    if (!active || live3d || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let off = 0;
    const id = window.setInterval(() => {
      setHop(true);
      off = window.setTimeout(() => setHop(false), 700);
    }, 16000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(off);
    };
  }, [active, live3d]);

  if (!ready || entry === null) return null;

  const setAway = (value: boolean) => writeHidden(value);

  if (hidden) {
    return (
      <div className="fixed bottom-3 right-3 z-30 print:hidden" data-no-print>
        <button
          type="button"
          onClick={() => setAway(false)}
          aria-label={GUIDE.show}
          className="block size-12 overflow-hidden rounded-full border bg-card shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {/* decorative: the button's label says what it does */}
          <img
            src={src("hello", 160)}
            alt=""
            width={48}
            height={46}
            className="size-full object-cover object-top"
          />
        </button>
      </div>
    );
  }

  return (
    <div
      data-no-print
      className="pointer-events-none fixed bottom-2 right-2 z-30 flex items-end gap-1 sm:bottom-4 sm:right-4 print:hidden"
    >
      {/* Nothing here catches the pointer except the two small buttons: Dex is a picture on top of the
          page, and a click on him goes to whatever is underneath. */}
      {bubble && (
        <div className="relative mb-9 max-w-[190px] rounded-2xl rounded-br-sm border bg-card px-3 py-2 text-sm leading-snug text-foreground shadow-lg sm:max-w-[230px]">
          <p>{entry.line}</p>
        </div>
      )}
      <div
        ref={box}
        className={
          live3d
            ? "relative h-[170px] w-[140px] sm:h-[220px] sm:w-[180px]"
            : "relative w-[88px] sm:w-[118px]"
        }
      >
        <div className={live3d ? "h-full w-full" : hop ? "dex-hop" : "dex-bob"}>
          <div className={live3d ? "relative h-full w-full" : "relative"}>
            {want3d && !failed3d && (
              <Dex3D
                mood={entry.mood}
                onReady={() => setReady3d(true)}
                onUnavailable={() => setFailed3d(true)}
                adaptive={!forced3d()}
                className="absolute inset-0 h-full w-full"
              />
            )}
            <span
              aria-hidden
              className={
                live3d
                  ? "hidden"
                  : "absolute -bottom-0.5 left-[14%] h-2.5 w-[72%] rounded-full bg-foreground/20 blur-[5px] dark:bg-black/50"
              }
            />
            <div
              ref={stage}
              className={
                live3d ? "pointer-events-none invisible absolute" : "relative will-change-transform"
              }
            >
              {/* The picture is decoration; the line beside it carries the meaning. */}
              <img
                key={entry.mood}
                src={src(entry.mood, 320)}
                srcSet={srcSet(entry.mood)}
                sizes="(min-width: 640px) 118px, 88px"
                alt=""
                width={GUIDE_ASPECT.width}
                height={GUIDE_ASPECT.height}
                draggable={false}
                decoding="async"
                className="dex-swap block h-auto w-full select-none drop-shadow-[0_8px_8px_rgba(19,33,63,0.28)]"
              />
            </div>
          </div>
        </div>
        <div className="pointer-events-auto absolute -top-1 right-0 flex gap-1">
          <button
            type="button"
            onClick={() => setTip({ path: pathname, open: !bubble })}
            aria-label={GUIDE.tipToggle}
            aria-pressed={bubble}
            className={SMALL_BUTTON}
          >
            ?
          </button>
          <button
            type="button"
            onClick={() => setAway(true)}
            aria-label={GUIDE.hide}
            className={SMALL_BUTTON}
          >
            <span aria-hidden>&times;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
