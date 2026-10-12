import { Compass } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PageState } from "@/components/PageState";
import { SURFACES } from "@/content/surfaces";
import { NotFoundActions } from "@/components/NotFoundActions";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <MarketingShell width="tool">
      <PageState icon={Compass} {...SURFACES.notFound}>
        <NotFoundActions />
      </PageState>
    </MarketingShell>
  );
}
