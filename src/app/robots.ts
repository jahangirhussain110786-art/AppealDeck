import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    // The API, the sign-in callback and the dev-only gallery are not pages anyone should land on.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/dev/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
