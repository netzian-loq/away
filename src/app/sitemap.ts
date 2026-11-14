import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // /jesterfv1, /oneprodige and /checkout are deliberately absent: all are
  // noindex, reached only by a shared link or from the pricing table. /contact is gone from the
  // sitemap too — nothing on the site links to it any more, so listing it would
  // point crawlers at a page visitors can't reach.
  const routes = ["", "/services", "/uefi-kompile", "/overtuner", "/about"];
  // URLs only. lastModified was `new Date()`, so every deploy told crawlers
  // every page had just changed, which teaches them to ignore the field;
  // changeFrequency and priority are ignored by Google outright.
  return routes.map((route) => ({ url: `${SITE.url}${route}` }));
}
