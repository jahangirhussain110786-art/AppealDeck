import type { Metadata } from "next";
import { LegalPage, legalPageMetadata } from "@/components/LegalPage";
import { pageMetadata } from "@/content/pageMetadata";

export const metadata: Metadata = pageMetadata({
  ...legalPageMetadata.refund,
  canonical: "/refund",
});

export default function RefundPage() {
  return <LegalPage doc="refund" />;
}
