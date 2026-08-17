import type { MetadataRoute } from "next";
import { SITE_URL, verdictPath } from "@/lib/site";
import { VERDICT_SYMBOLS } from "@/lib/verdict-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const stableRoutes = ["/", ...VERDICT_SYMBOLS.map(verdictPath)];
  return stableRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
