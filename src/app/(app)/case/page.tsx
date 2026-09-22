import { getOptionalUser } from "@/lib/auth";
import { isViolationKind, type ViolationKind } from "@/core";
import { CaseWorkspace } from "@/components/workspace/CaseWorkspace";

// AA-39: this page used to restate the kind union and a matching literal array, both of which
// silently drifted from core. `?kind=VERIFICATION` would have been dropped as invalid.
function isValidKind(value: string | undefined): value is ViolationKind {
  return isViolationKind(value);
}

/**
 * The case workspace is now the only journey (founder direction, 22 Sep 2026: "retire the classic
 * interview").
 *
 * `?mode=classic` used to render a standalone guided interview here as a parallel product. It is
 * gone: nothing linked to it, it produced cases the workspace then had to migrate, and keeping two
 * front doors meant every feature had to be built twice — document checking was already only
 * reachable from one of them. The parameter is now ignored rather than erroring, so an old
 * bookmark lands on the seller's real case instead of a dead end.
 *
 * Cases saved before the workspace existed are migrated on open, losslessly, by `CaseWorkspace`.
 */
export default async function CasePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; mode?: string; view?: string }>;
}) {
  const params = await searchParams;
  const user = await getOptionalUser();
  const initialKind = isValidKind(params.kind) ? params.kind : undefined;

  return (
    <CaseWorkspace signedIn={Boolean(user)} initialKind={initialKind} initialView={params.view} />
  );
}
