"use client";

import { useEffect, useRef } from "react";
import type { GuideMood } from "@/content/guide";
import type { DexController, DexMood } from "./dexModel";

/** The page's mood, as a pose for the 3D model. */
export const POSE_FOR: Record<GuideMood, DexMood> = {
  hello: "hello",
  happy: "hello",
  cheering: "cheer",
  explaining: "explain",
  thinking: "think",
  calm: "calm",
};

/**
 * Dex in 3D, drawn on a canvas. It is loaded only after the visitor has done something, it stops when
 * it is off screen or the tab is hidden, and when motion is reduced it draws one still frame. If 3D is
 * not possible it calls `onUnavailable` and the caller keeps the picture.
 */
export function Dex3D({
  mood,
  cue,
  onReady,
  onUnavailable,
  adaptive = true,
  className,
}: {
  mood: GuideMood;
  /** A small gesture to make now: a nod, or a hop. A new `id` asks for it again. */
  cue?: { kind: "nod" | "hop"; id: number } | null;
  onReady?: () => void;
  onUnavailable?: () => void;
  /** Fall back to the picture if the animation runs slowly. Off when 3D is asked for by hand. */
  adaptive?: boolean;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ctl = useRef<DexController | null>(null);
  const moodRef = useRef(mood);
  const readyRef = useRef(onReady);
  const failRef = useRef(onUnavailable);
  const adaptiveRef = useRef(adaptive);

  useEffect(() => {
    moodRef.current = mood;
    ctl.current?.setMood(POSE_FOR[mood]);
  }, [mood]);

  useEffect(() => {
    if (!cue) return;
    if (cue.kind === "nod") ctl.current?.nod();
    else ctl.current?.hop();
  }, [cue]);

  useEffect(() => {
    readyRef.current = onReady;
    failRef.current = onUnavailable;
    adaptiveRef.current = adaptive;
  });

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let alive = true;
    let visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sync = () => {
      if (!ctl.current || reduced) return;
      if (visible && !document.hidden) ctl.current.start();
      else ctl.current.stop();
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ctl.current?.setLook(
        (e.clientX - (r.left + r.width / 2)) / 420,
        (e.clientY - (r.top + r.height / 2)) / 420,
      );
    };
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      sync();
    });
    const ro = new ResizeObserver(() => ctl.current?.resize(el.clientWidth, el.clientHeight));
    // The parts modelled in Blender come with him when they load; if that file cannot be fetched he is
    // built in code instead, so he never fails to appear because of it.
    Promise.all([
      import("./dexModel"),
      import("./dexAssets").then((m) => m.loadDexParts()).catch(() => undefined),
    ])
      .then(([{ createDex }, parts]) => {
        if (!alive) return;
        try {
          ctl.current = createDex(el, {
            still: reduced,
            parts,
            onSlow: adaptiveRef.current ? () => failRef.current?.() : undefined,
          });
        } catch {
          failRef.current?.();
          return;
        }
        ctl.current.setMood(POSE_FOR[moodRef.current]);
        io.observe(el);
        ro.observe(el);
        window.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("visibilitychange", sync);
        sync();
        if (reduced) ctl.current.renderOnce();
        readyRef.current?.();
      })
      .catch(() => failRef.current?.());
    return () => {
      alive = false;
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", sync);
      ctl.current?.dispose();
      ctl.current = null;
    };
  }, []);

  return <canvas ref={canvas} className={className} aria-hidden />;
}
