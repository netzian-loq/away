import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { SITE } from "@/content/site";

describe("sitemap", () => {
  it("includes all four pages", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(SITE.url);
    expect(urls).toContain(`${SITE.url}/services`);
    expect(urls).toContain(`${SITE.url}/about`);
    expect(urls).toContain(`${SITE.url}/contact`);
  });
});
