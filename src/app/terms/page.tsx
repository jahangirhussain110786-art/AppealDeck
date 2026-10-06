import type { Metadata } from "next";
import { LegalPage, legalPageMetadata } from "@/components/LegalPage";
import { pageMetadata } from "@/content/pageMetadata";

export const metadata: Metadata = pageMetadata({
  ...legalPageMetadata.terms,
  canonical: "/terms",
});

export default function TermsPage() {
  return <LegalPage doc="terms" />;
}
