import Link from "next/link";
import { Compass } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PageState } from "@/components/PageState";
import { SURFACES } from "@/content/surfaces";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <MarketingShell width="tool">
      <PageState icon={Compass} {...SURFACES.notFound}>
        <Button asChild>
          <Link href="/dashboard">{SURFACES.notFound.primary}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">{SURFACES.notFound.secondary}</Link>
        </Button>
      </PageState>
    </MarketingShell>
  );
}
