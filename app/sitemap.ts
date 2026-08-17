import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/methodology`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/funding-arbitrage`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
