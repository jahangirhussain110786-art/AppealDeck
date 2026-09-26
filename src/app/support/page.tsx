import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mail as MailIcon, X } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AccentWord } from "@/components/ui/accent-word";
import { splitAccent } from "@/lib/splitAccent";
import { SUPPORT, SUPPORT_EMAIL, BILLING_EMAIL } from "@/content/support";
import { SHARED } from "@/content/shared";

export const metadata: Metadata = {
  alternates: { canonical: "/support" },
  title: SHARED.metadata.titleSupport,
  description: SHARED.metadata.descriptionSupport,
  openGraph: {
    title: SHARED.metadata.titleSupport,
    description: SHARED.metadata.descriptionSupport,
  },
};

const HERO = splitAccent(SUPPORT.hero.title, SUPPORT.hero.accent);

/**
 * Support (v5, 26 Sep 2026, prototype support.html): who answers and how to write, then what
 * support cannot do — said first, so nobody waits on a reply while an Amazon deadline runs — then
 * the operator, the reply window and what to include, and the pages that usually answer faster.
 * The support address is on the page once, as the hero's button.
 */
export default function SupportPage() {
  const contactBody = SUPPORT.contact.body.split(/(\{billing\})/);
  return (
    <MarketingShell bleed>
      <section className="stage dark text-foreground">
        <div className="mx-auto grid max-w-marketing items-center gap-12 px-4 pb-36 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-6">
            <h1 className="text-balance text-[clamp(2.4rem,1.3rem+3.4vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
              {HERO ? (
                <>
                  {HERO.pre}
                  <AccentWord className="text-primary">{HERO.accent}</AccentWord>
                  {HERO.post}
                </>
              ) : (
                SUPPORT.hero.title
              )}
            </h1>
            <p className="max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
              {SUPPORT.hero.lede} {SUPPORT.intro}
            </p>
            <Button asChild size="lg">
              <a href={`mailto:${SUPPORT_EMAIL}`}>
                <MailIcon aria-hidden />
                {SUPPORT_EMAIL}
              </a>
            </Button>
          </div>
          <div className="w-full max-w-md justify-self-center rounded-[28px] bg-white p-6 shadow-stage lg:justify-self-end">
            <Image
              src="/illustrations/person-laptop.svg"
              alt={SUPPORT.hero.illustration}
              width={320}
              height={240}
              className="h-auto w-full"
              priority
              unoptimized
            />
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-24 w-full max-w-[56.25rem] px-4 pb-20 sm:px-8">
        <section
          aria-labelledby="support-cannot"
          className="overflow-hidden rounded-[20px] bg-card shadow-lift ring-1 ring-inset ring-border"
        >
          <h2
            id="support-cannot"
            className="border-b border-border px-6 py-4 text-base font-semibold text-foreground"
          >
            {SUPPORT.limits.title}
          </h2>
          <ul>
            {SUPPORT.limits.items.map((item) => (
              <li
                key={item}
                className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 border-b border-border px-6 py-4 text-[0.9375rem] last:border-b-0"
              >
                <span
                  aria-hidden
                  className="inline-flex size-[26px] items-center justify-center rounded-full bg-destructive/10 text-destructive"
                >
                  <X className="size-3.5" strokeWidth={3} />
                </span>
                <span className="text-foreground/90">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="support-about" className="mt-14">
          <h2
            id="support-about"
            className="text-lg font-semibold tracking-[-0.02em] text-foreground"
          >
            {SUPPORT.about}
          </h2>
          <div className="mt-4 grid gap-8 border-t border-border pt-6 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{SUPPORT.operator.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {SUPPORT.operator.body}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {SUPPORT.contact.windowTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {SUPPORT.contact.window}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {contactBody.map((part, i) =>
                  part === "{billing}" ? (
                    <a
                      key={i}
                      className="font-mono text-link underline underline-offset-4"
                      href={`mailto:${BILLING_EMAIL}`}
                    >
                      {BILLING_EMAIL}
                    </a>
                  ) : (
                    part
                  ),
                )}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{SUPPORT.include.title}</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {SUPPORT.include.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          {/* The one line on this page that protects a frightened seller from a stranger. */}
          <Alert variant="warning" className="mt-6">
            <AlertDescription>{SUPPORT.include.caution}</AlertDescription>
          </Alert>
        </section>

        <section aria-labelledby="support-tiles" className="mt-14">
          <h2
            id="support-tiles"
            className="text-lg font-semibold tracking-[-0.02em] text-foreground"
          >
            {SUPPORT.tiles.title}
          </h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-3">
            {SUPPORT.tiles.items.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="group flex flex-col gap-1.5 rounded-[18px] bg-card p-5 shadow-card ring-1 ring-inset ring-border transition-shadow hover:shadow-lift"
              >
                <strong className="flex items-center justify-between gap-2 font-semibold text-foreground">
                  {t.title}
                  <ArrowRight
                    aria-hidden
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  />
                </strong>
                <span className="text-sm text-muted-foreground">{t.body}</span>
              </Link>
            ))}
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            <Link className="text-link underline underline-offset-4" href="/faq">
              {SUPPORT.elsewhere.faq}
            </Link>
            {" · "}
            <Link className="text-link underline underline-offset-4" href="/terms">
              {SUPPORT.elsewhere.terms}
            </Link>
          </p>
        </section>
      </div>
    </MarketingShell>
  );
}
