import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { SITE } from "@/content/site";

describe("sitemap", () => {
  it("includes every public page", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(SITE.url);
    expect(urls).toContain(`${SITE.url}/services`);
    expect(urls).toContain(`${SITE.url}/about`);
  });

  it("leaves the unlisted partner and checkout pages out", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).not.toContain(`${SITE.url}/cosmo`);
    expect(urls).not.toContain(`${SITE.url}/checkout`);
  });

  // Nothing on the site links to /contact any more, so advertising it to
  // crawlers would send them to a page no visitor can navigate to.
  it("drops the retired contact page", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).not.toContain(`${SITE.url}/contact`);
  });
});
