import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SHARED } from "@/content/shared";
import { GUIDES } from "@/content/guides";

function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-eyebrow uppercase text-muted-foreground">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-foreground/80 hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface-2/60">
      <div className="mx-auto grid max-w-marketing gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Logo size="sm" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {SHARED.footer.tagline}
          </p>
        </div>
        <FooterGroup
          title={SHARED.footer.groups.product}
          links={[
            { href: "/decode", label: SHARED.nav.decode },
            { href: "/pricing", label: SHARED.nav.pricing },
            { href: "/faq", label: SHARED.nav.faq },
          ]}
        />
        <FooterGroup
          title={SHARED.footer.groups.guides}
          links={GUIDES.map((g) => ({ href: `/guides/${g.slug}`, label: g.navLabel }))}
        />
        <FooterGroup
          title={SHARED.footer.groups.legal}
          links={[
            { href: "/privacy", label: SHARED.footer.nav.privacy },
            { href: "/terms", label: SHARED.footer.nav.terms },
            { href: "/refund", label: SHARED.footer.nav.refund },
            // B-22: this pointed at the privacy policy's contact anchor, because no support
            // surface existed anywhere in the product. It now points at one.
            { href: "/support", label: SHARED.footer.nav.support },
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-marketing flex-col gap-2 px-4 py-6 text-xs leading-relaxed text-muted-foreground sm:px-6 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="max-w-3xl space-y-1.5">
            <p>{SHARED.footer.neverSubmits}</p>
            <p>{SHARED.footer.independence}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5 md:items-end">
            <p>{SHARED.footer.notLegalAdvice}</p>
            <p className="tabular-nums">
              {SHARED.footer.copyright.replace("{year}", String(year))}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
