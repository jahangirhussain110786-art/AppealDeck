import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";
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
    <a className="font-mono text-primary underline underline-offset-4" href={`mailto:${address}`}>
      {address}
    </a>
  );
}

export default function SupportPage() {
  const contactBody = SUPPORT.contact.body.split(/(\{support\}|\{billing\})/);
  return (
    <MarketingShell className="max-w-app">
      <div className="py-10 sm:py-14">
        <header className="mb-8 flex items-start gap-4 sm:mb-10">
          <IconTile icon={LifeBuoy} tone="info" className="mt-1 hidden sm:inline-flex" />
          <div>
            <p className="text-eyebrow uppercase text-primary">{SUPPORT.eyebrow}</p>
            <h1 className="mt-2 font-accent text-h1 text-foreground">{SUPPORT.title}</h1>
            <p className="mt-3 text-base text-muted-foreground">{SUPPORT.intro}</p>
          </div>
        </header>

        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <h2 className="font-accent text-2xl font-medium text-foreground">
              {SUPPORT.operator.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {SUPPORT.operator.body}
            </p>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-accent text-2xl font-medium text-foreground">
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

          <Card className="p-5 sm:p-6">
            <h2 className="font-accent text-2xl font-medium text-foreground">
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

          <Card className="p-5 sm:p-6">
            <h2 className="font-accent text-2xl font-medium text-foreground">
              {SUPPORT.limits.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{SUPPORT.limits.body}</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {SUPPORT.limits.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-accent text-2xl font-medium text-foreground">
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
                  <Link className="text-primary underline underline-offset-4" href={link.href}>
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
