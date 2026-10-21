"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  GUIDE,
  GUIDE_ASPECT,
  GUIDE_WIDTHS,
  SITUATIONS,
  guideFor,
  type GuideEntry,
  type GuideMood,
} from "@/content/guide";
import { useCurrentSituation } from "@/lib/guideSignal";

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

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

const SMALL_BUTTON =
  "flex size-7 items-center justify-center rounded-full border bg-card/90 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const src = (mood: GuideMood, w: number) => `/mascot/dex-${mood}-${w}.webp`;
const srcSet = (mood: GuideMood) => GUIDE_WIDTHS.map((w) => `${src(mood, w)} ${w}w`).join(", ");
const SIZES = "(min-width: 640px) 118px, 88px";

/**
 * Loads (and decodes) a mood's picture with the same srcset the page will use, so the browser keeps the
 * file and shows it at once. It always resolves: if the picture cannot load, Dex still speaks.
 */
function preload(mood: GuideMood, small = false): Promise<void> {
  const img = new Image();
  if (small) img.src = src(mood, 160);
  else {
    img.sizes = SIZES;
    img.srcset = srcSet(mood);
    img.src = src(mood, 320);
  }
  return img.decode().then(
    () => undefined,
    () => undefined,
  );
}

/**
 * Dex, the guide in the corner of every page.
 *
 * One fixed line and one mood per page (`src/content/guide.ts`). He is not a chat window. He turns to
 * look at the pointer (a small tilt), bobs, hops now and then, and can be hidden; the choice is kept.
 * Everything that moves stops for people who ask for reduced motion.
 */
export function GuideDex() {
  const pathname = usePathname();
  // What the page says the visitor is doing (the decoder reading, a case ready to send...) can change his
  // line, his mood and give him a small gesture; without one he keeps the page's own line.
  const situation = useCurrentSituation();
  // A lost connection beats whatever the page said: he tells the visitor, then goes back when it returns.
  const offline = useSyncExternalStore(
    subscribeOnline,
    () => !navigator.onLine,
    () => false,
  );
  const base = guideFor(pathname, situation);
  const entry: GuideEntry | null = offline && base !== null ? SITUATIONS["error.offline"] : base;
  const entryKey = `${pathname}|${offline ? "offline" : (situation ?? "")}`;
  // False while rendering on the server and during hydration, true after: Dex only appears in the browser.
  const ready = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const hidden = useSyncExternalStore(subscribeHidden, readHidden, () => false);
  // The line is open on a new page until its timer runs out; a tap on Dex opens or closes it.
  const [tip, setTip] = useState<{ path: string; open: boolean } | null>(null);
  // What is on screen: the picture comes first, and the line and the two buttons appear with it, never before.
  const [shown, setShown] = useState<{ entry: GuideEntry; key: string } | null>(null);
  const [smallReady, setSmallReady] = useState(false);
  const shownKey = shown?.key ?? entryKey;
  const bubble = tip && tip.path === shownKey ? tip.open : true;
  const [hop, setHop] = useState(false);
  const [nod, setNod] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const mood = entry?.mood;
  const line = entry?.line;
  const motionNow = entry?.motion;
  // Fetch the picture before anything else of his is drawn; then show picture, line and buttons together.
  useEffect(() => {
    if (!ready || hidden || mood === undefined || line === undefined) return;
    let alive = true;
    void preload(mood).then(() => {
      if (alive)
        setShown({
          entry: { mood, line, ...(motionNow ? { motion: motionNow } : {}) },
          key: entryKey,
        });
    });
    return () => {
      alive = false;
    };
  }, [ready, hidden, mood, line, motionNow, entryKey]);
  // The small round button he shrinks into when hidden is also drawn only once its picture is there.
  useEffect(() => {
    if (!ready || !hidden) return;
    let alive = true;
    void preload("hello", true).then(() => {
      if (alive) setSmallReady(true);
    });
    return () => {
      alive = false;
    };
  }, [ready, hidden]);

  // The line shows for a few seconds on each new page, and again when the situation changes.
  const lineKey = shown?.key;
  useEffect(() => {
    if (!lineKey) return;
    const t = window.setTimeout(() => setTip({ path: lineKey, open: false }), 8000);
    return () => window.clearTimeout(t);
  }, [lineKey]);

  // A situation with a gesture: the picture does a small nod.
  const motion = entry?.motion;
  useEffect(() => {
    if (!motion || !situation) return;
    // a moment after the line appears, so the gesture lands with it
    const start = window.setTimeout(() => {
      setNod(true);
    }, 250);
    const off = window.setTimeout(() => setNod(false), 1050);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(off);
    };
  }, [motion, situation]);

  const active = ready && !hidden && entry !== null;

  // Turn toward the pointer; when it has been still, sway slowly so he never freezes.
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
  }, [active]);

  // A small hop every so often.
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let off = 0;
    const id = window.setInterval(() => {
      setHop(true);
      off = window.setTimeout(() => setHop(false), 700);
    }, 16000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(off);
    };
  }, [active]);

  if (!ready || entry === null) return null;

  const setAway = (value: boolean) => writeHidden(value);

  if (hidden) {
    if (!smallReady) return null;
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

  if (shown === null) return null;
  const view = shown.entry;

  return (
    <div
      data-no-print
      className="pointer-events-none fixed bottom-2 right-2 z-30 flex items-end gap-1 sm:bottom-4 sm:right-4 print:hidden"
    >
      {/* Nothing here catches the pointer except the two small buttons: Dex is a picture on top of the
          page, and a click on him goes to whatever is underneath. */}
      {bubble && (
        <div className="relative mb-9 max-w-[190px] rounded-2xl rounded-br-sm border bg-card px-3 py-2 text-sm leading-snug text-foreground shadow-lg sm:max-w-[230px]">
          <p>{view.line}</p>
        </div>
      )}
      <div ref={box} className="relative w-[88px] sm:w-[118px]">
        <div className={hop ? "dex-hop" : nod ? "dex-nod" : "dex-bob"}>
          <div className="relative">
            <span
              aria-hidden
              className="absolute -bottom-0.5 left-[14%] h-2.5 w-[72%] rounded-full bg-foreground/20 blur-[5px] dark:bg-black/50"
            />
            <div ref={stage} className="relative will-change-transform">
              {/* The picture is decoration; the line beside it carries the meaning. */}
              <img
                key={view.mood}
                src={src(view.mood, 320)}
                srcSet={srcSet(view.mood)}
                sizes={SIZES}
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
            onClick={() => setTip({ path: shown.key, open: !bubble })}
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
