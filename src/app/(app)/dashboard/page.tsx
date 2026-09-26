import { Metadata } from "next";
import { getOptionalUser } from "@/lib/auth";
import { fetchLicenseForUser } from "@/lib/license";
import { LayoutGrid } from "lucide-react";
import { DashboardClient } from "@/components/DashboardClient";
import { PageIntro } from "@/components/PageIntro";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: APP.dashboard.title,
  description: APP.dashboard.subtitle,
};

export default async function DashboardPage() {
  const user = await getOptionalUser();
  const signedIn = Boolean(user);
  const license = signedIn
    ? await fetchLicenseForUser(user?.id)
    : { status: "none" as const, plan: null, licenseKey: null };

  return (
    <div className="space-y-6">
      <PageIntro
        icon={LayoutGrid}
        eyebrow={APP.dashboard.eyebrow}
        title={APP.dashboard.title}
        description={APP.dashboard.subtitle}
        illustration={{
          src: "/illustrations/step-calendar.svg",
          alt: APP.dashboard.illustrationAlt,
        }}
      />
      <DashboardClient license={license} signedIn={signedIn} />
    </div>
  );
}
