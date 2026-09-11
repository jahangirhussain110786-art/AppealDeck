import { notFound } from "next/navigation";
import { DevUiGallery } from "./DevUiGallery";

export const dynamic = "force-dynamic";

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <DevUiGallery />;
}
