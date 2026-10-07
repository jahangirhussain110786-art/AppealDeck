// One place that builds a page's search and social metadata.
//
// Next replaces a parent's `openGraph` object shallowly: a page that set only a title and a
// description lost the root layout's siteName, url and type, and no page set `twitter` at all, so
// shared links fell back to the root card text. Every public page now builds the full set here.
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/urls";

/**
 * The share image. Next drops the root segment's file-based `opengraph-image` for any page that sets
 * its own `openGraph`, and every public page does through this helper, so only the home page had a
 * preview image and every other shared link (a guide posted in a seller forum, the pricing page) was
 * a bare link under a "large image" card with no image (found 7 Oct 2026, launch audit). The file is
 * a copy of `src/app/opengraph-image.png`; `pageMetadata.test.ts` fails if they drift apart.
 */
export const SHARE_IMAGE = {
  url: "/brand/og-1200x630.png",
  width: 1200,
  height: 630,
  alt: "AppealDeck: Decode your Amazon notice. Draft your Plan of Action. You submit it yourself.",
} as const;

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
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: SHARE_IMAGE.url, alt: SHARE_IMAGE.alt }],
    },
  };
}
