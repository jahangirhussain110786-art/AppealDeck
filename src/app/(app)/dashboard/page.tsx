import { Metadata } from "next";
import { getOptionalUser } from "@/lib/auth";
import { countSingleResponses, fetchLicenseForUser } from "@/lib/license";
import { DashboardClient } from "@/components/DashboardClient";
import { APP } from "@/content/app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: APP.dashboard.title,
  description: APP.dashboard.subtitle,
};

/** The page heading is the greeting's sentence, which `DashboardClient` writes once the cases are read. */
export default async function DashboardPage() {
  const user = await getOptionalUser();
  const signedIn = Boolean(user);
  /*
    26 Oct 2026: a failed lookup used to throw and take the whole page down, and a silent fallback
    would have told a paying seller they hold no Pass. `null` is a third answer — "could not ask" —
    and the status row says that. The case itself is on the device and loads without this.
  */
  const license = user
    ? await fetchLicenseForUser(user.id).catch(() => null)
    : { status: "none" as const, plan: null, licenseKey: null };
  /*
    A One Response is not an Appeal Pass, so the licence lookup above does not report it (26 Oct
    2026). Asked only when there is no active Pass; a failed count says "no row", never "none held".
  */
  const singles =
    user && license && license.status !== "active"
      ? await countSingleResponses(user.id).catch(() => 0)
      : 0;

  return (
    <div className="max-w-[67.5rem]">
      <DashboardClient license={license} singles={singles} signedIn={signedIn} />
    </div>
  );
}
