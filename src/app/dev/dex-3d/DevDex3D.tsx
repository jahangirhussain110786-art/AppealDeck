"use client";

import { useEffect, useRef, useState } from "react";
import type { DexController, DexMood, DexSkin } from "@/components/dex3d/dexModel";

/** The look on this page: the two built in code, and the one with parts modelled in Blender. */
type Look = DexSkin | "blender";

const MOODS: DexMood[] = [
  "hello",
  "explain",
  "think",
  "calm",
  "cheer",
  "steady",
  "idle",
  "thumbs",
  "peace",
];
const SKINS: Look[] = ["blender", "brand", "storybook"];

/** Developer page: Dex in 3D, every pose, and a slider to turn him all the way round. Never built in production. */
export function DevDex3D() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dex = useRef<DexController | null>(null);
  const moodRef = useRef<DexMood>("hello");
  const [mood, setMood] = useState<DexMood>("hello");
  const [skin, setSkin] = useState<Look>("blender");
  const [yaw, setYaw] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    let ctl: DexController | null = null;
    const el = canvas.current;
    if (!el) return;
    Promise.all([
      import("@/components/dex3d/dexModel"),
      skin === "blender"
        ? import("@/components/dex3d/dexAssets").then((m) => m.loadDexParts())
        : null,
    ])
      .then(([{ createDex }, parts]) => {
        if (!alive) return;
        ctl = createDex(el, {
          still: new URLSearchParams(window.location.search).has("still"),
          skin: skin === "blender" ? "brand" : skin,
          parts: parts ?? undefined,
        });
        dex.current = ctl;
        (window as unknown as { __dex?: DexController }).__dex = ctl;
        ctl.setMood(moodRef.current);
        ctl.start();
      })
      .catch((e: unknown) => setError(String(e)));
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ctl?.setLook(
        (e.clientX - (r.left + r.width / 2)) / 420,
        (e.clientY - (r.top + r.height / 2)) / 420,
      );
    };
    window.addEventListener("pointermove", onMove);
    const ro = new ResizeObserver(() => ctl?.resize(el.clientWidth, el.clientHeight));
    ro.observe(el);
    return () => {
      alive = false;
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      ctl?.dispose();
      dex.current = null;
    };
  }, [skin]);

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-xl font-semibold">Dex in 3D</h1>
      <p className="text-sm text-muted-foreground">
        Move the pointer to make him look. Pick a pose. Drag the slider to turn him all the way
        round. Boing, spin and hop show the cartoon motion: squash, stretch, overshoot and a cape
        that drags behind.
      </p>
      <div className="flex flex-wrap gap-2">
        {SKINS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSkin(s)}
            aria-pressed={skin === s}
            className="rounded-full border px-3 py-1 text-sm aria-pressed:bg-foreground aria-pressed:text-background"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              moodRef.current = m;
              setMood(m);
              dex.current?.setMood(m);
            }}
            aria-pressed={mood === m}
            className="rounded-full border px-3 py-1 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {m}
          </button>
        ))}
        <button
          type="button"
          onClick={() => dex.current?.hop()}
          className="rounded-full border px-3 py-1 text-sm"
        >
          hop
        </button>
        <button
          type="button"
          onClick={() => dex.current?.boing()}
          className="rounded-full border px-3 py-1 text-sm"
        >
          boing
        </button>
        <button
          type="button"
          onClick={() => dex.current?.spin()}
          className="rounded-full border px-3 py-1 text-sm"
        >
          spin
        </button>
      </div>
      <label className="flex items-center gap-3 text-sm">
        Turn
        <input
          type="range"
          min={-180}
          max={180}
          value={yaw ?? 0}
          onChange={(e) => {
            const d = Number(e.target.value);
            setYaw(d);
            dex.current?.setYaw((d * Math.PI) / 180);
          }}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => {
            setYaw(null);
            dex.current?.setYaw(null);
          }}
          className="rounded-full border px-3 py-1"
        >
          follow pointer
        </button>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="rounded-3xl bg-muted p-2">
        <canvas ref={canvas} className="block h-[640px] w-full" aria-label="Dex, in 3D" />
      </div>
    </main>
  );
}
