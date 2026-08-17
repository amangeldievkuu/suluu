import type { MetadataRoute } from "next";

import { CATALOG, componentHref, SITE_URL } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/components",
    ...CATALOG.map((entry) => componentHref(entry.slug)),
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
