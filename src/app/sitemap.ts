import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // /cosmo and /checkout are deliberately absent: both are noindex, reached
  // only by a shared link or from the pricing table. /contact is gone from the
  // sitemap too — nothing on the site links to it any more, so listing it would
  // point crawlers at a page visitors can't reach.
  const routes = ["", "/services", "/about"];
  return routes.map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
