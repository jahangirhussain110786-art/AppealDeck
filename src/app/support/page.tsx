import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Mail as MailIcon } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { Card } from "@/components/ui/card";
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

function Mail({ address }: { address: string }) {
  return (
    <a className="font-mono text-link underline underline-offset-4" href={`mailto:${address}`}>
      {address}
    </a>
  );
}

const HERO = splitAccent(SUPPORT.hero.title, SUPPORT.hero.accent);

export default function SupportPage() {
  const contactBody = SUPPORT.contact.body.split(/(\{support\}|\{billing\})/);
  return (
    <MarketingShell bleed>
      <section className="stage dark text-foreground">
        <div className="mx-auto grid max-w-marketing items-center gap-12 px-4 pb-36 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-6">
            <p className="text-sm font-semibold text-primary">{SUPPORT.eyebrow}</p>
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
                {SUPPORT.hero.emailCta}
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
      <div className="relative mx-auto -mt-24 w-full max-w-app px-4 pb-20 sm:px-8">
        <div className="space-y-5">
          <Card className="rounded-[20px] p-6 shadow-lift sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {SUPPORT.operator.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {SUPPORT.operator.body}
            </p>
          </Card>

          <Card className="rounded-[20px] p-6 shadow-lift sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {SUPPORT.contact.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {contactBody.map((part, i) =>
                part === "{support}" ? (
                  <Mail key={i} address={SUPPORT_EMAIL} />
                ) : part === "{billing}" ? (
                  <Mail key={i} address={BILLING_EMAIL} />
                ) : (
                  part
                ),
              )}
            </p>
            <h3 className="mt-5 text-sm font-medium text-foreground">
              {SUPPORT.contact.windowTitle}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {SUPPORT.contact.window}
            </p>
          </Card>

          <Card className="rounded-[20px] p-6 shadow-lift sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {SUPPORT.include.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{SUPPORT.include.body}</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {SUPPORT.include.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {/* The one line on this page that protects a frightened seller from a stranger. */}
            <Alert variant="warning" className="mt-4">
              <AlertDescription>{SUPPORT.include.caution}</AlertDescription>
            </Alert>
          </Card>

          <Card className="rounded-[20px] p-6 shadow-lift sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {SUPPORT.limits.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{SUPPORT.limits.body}</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {SUPPORT.limits.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>

          <Card className="rounded-[20px] p-6 shadow-lift sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {SUPPORT.elsewhere.title}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { href: "/faq", label: SUPPORT.elsewhere.faq },
                { href: "/refund", label: SUPPORT.elsewhere.refund },
                { href: "/privacy", label: SUPPORT.elsewhere.privacy },
                { href: "/terms", label: SUPPORT.elsewhere.terms },
              ].map((link) => (
                <li key={link.href}>
                  <Link className="text-link underline underline-offset-4" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </MarketingShell>
  );
}
