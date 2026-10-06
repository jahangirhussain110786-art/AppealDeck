// One place that builds a page's search and social metadata.
//
// Next replaces a parent's `openGraph` object shallowly: a page that set only a title and a
// description lost the root layout's siteName, url and type, and no page set `twitter` at all, so
// shared links fell back to the root card text. Every public page now builds the full set here.
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/urls";

export interface PageMetadataInput {
  title: string;
  description: string;
  /** The page's own path, such as "/pricing". */
  canonical: string;
  type?: "website" | "article";
}

export function pageMetadata({
  title,
  description,
  canonical,
  type = "website",
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type,
      siteName: "AppealDeck",
      title,
      description,
      url: new URL(canonical, SITE_URL).toString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
