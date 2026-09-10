import { requireUser } from "@/lib/auth";
import ComposeView from "@/components/ComposeView";

export const dynamic = "force-dynamic";

export default async function ComposePage() {
  await requireUser("/compose");
  return <ComposeView />;
}
