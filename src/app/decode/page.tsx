import { Metadata } from "next";
import Link from "next/link";
import DecodeClient from "./DecodeClient";
import { MarketingShell } from "@/components/MarketingShell";
import { DECODE } from "@/content/marketing";
import { GUIDES } from "@/content/guides";

export const metadata: Metadata = {
  alternates: { canonical: "/decode" },
  title: DECODE.metaTitle,
  description: DECODE.metaDescription,
  openGraph: {
    title: DECODE.metaTitle,
    description: DECODE.metaDescription,
  },
};

export default function DecodePage() {
  return (
    <MarketingShell width="tool">
      <DecodeClient />
      <nav aria-labelledby="decode-guides" className="mb-12 border-t border-border/60 pt-6">
        <h2 id="decode-guides" className="text-sm font-medium text-foreground">
          {DECODE.guidesTitle}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {g.navLabel}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </MarketingShell>
  );
}
