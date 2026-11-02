import type { Metadata } from "next";
import { pageMetadata } from "@/content/pageMetadata";
import { notFound } from "next/navigation";
import { NOTES, noteBySlug } from "@/content/notes";
import { NoteView } from "../NoteView";

export const dynamicParams = false;

export function generateStaticParams() {
  return NOTES.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const note = noteBySlug((await params).slug);
  if (!note) return {};
  return pageMetadata({
    title: note.metaTitle,
    description: note.description,
    canonical: `/notes/${note.slug}`,
    type: "article",
  });
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const note = noteBySlug((await params).slug);
  if (!note) notFound();
  return <NoteView note={note} />;
}
