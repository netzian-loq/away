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
    expect(urls).toContain(`${SITE.url}/contact`);
  });

  it("leaves the unlisted partner and checkout pages out", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).not.toContain(`${SITE.url}/cosmo`);
    expect(urls).not.toContain(`${SITE.url}/checkout`);
  });
});
