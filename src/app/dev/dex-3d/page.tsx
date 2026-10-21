import { notFound } from "next/navigation";
import { DevDex3D } from "./DevDex3D";

export const dynamic = "force-dynamic";

export default function DevDex3DPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevDex3D />;
}
