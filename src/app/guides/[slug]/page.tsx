import type { Metadata } from "next";
import { pageMetadata } from "@/content/pageMetadata";
import { notFound } from "next/navigation";
import { GUIDES, guideBySlug } from "@/content/guides";
import { GuideView } from "../GuideView";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const guide = guideBySlug((await params).slug);
  if (!guide) return {};
  return pageMetadata({
    title: guide.metaTitle,
    description: guide.description,
    canonical: `/guides/${guide.slug}`,
    type: "article",
  });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = guideBySlug((await params).slug);
  if (!guide) notFound();
  return <GuideView guide={guide} />;
}
