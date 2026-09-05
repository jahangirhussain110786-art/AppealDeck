import { LegalPage, legalMetadata } from "@/components/LegalPage";

export const metadata = legalMetadata("refund");

export default function RefundPage() {
  return <LegalPage doc="refund" />;
}
