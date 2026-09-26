"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stashDecodeDraft } from "@/lib/decodeDraft";
import { stripInvisibleChars } from "@/lib/idNormalize";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";
import { HOME } from "@/content/marketing";

/**
 * The paste tool in the home hero (v5): a polished object with the real input in it. Decoding
 * happens on /decode; the text travels there in memory, never through the URL or storage.
 */
export function HeroTool() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sample, setSample] = useState(false);
  const t = HOME.tool;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (value) stashDecodeDraft(value, sample);
    router.push("/decode");
  }

  return (
    <form
      onSubmit={submit}
      className="light rounded-[22px] bg-card p-2 text-foreground shadow-stage"
      aria-label={t.label}
    >
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-surface-2 px-4 py-2">
          <label
            htmlFor="hero-notice"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Mail aria-hidden className="size-4" />
            {t.label}
          </label>
          <button
            type="button"
            onClick={() => {
              setText(SAMPLE_NOTICE_TEXT);
              setSample(true);
            }}
            className="inline-flex min-h-10 items-center rounded-md px-2 text-sm font-medium text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t.sample}
          </button>
        </div>
        <textarea
          id="hero-notice"
          value={text}
          onChange={(e) => {
            setText(stripInvisibleChars(e.target.value));
            setSample(false);
          }}
          placeholder={t.placeholder}
          spellCheck={false}
          className="block h-44 w-full resize-none bg-card px-4 py-4 text-[0.95rem] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none sm:h-48"
        />
        <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-surface-2 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Lock aria-hidden className="size-3.5" />
            {t.note}
          </span>
          <Button type="submit">
            {t.submit}
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>
    </form>
  );
}
