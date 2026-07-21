import { describe, expect, it } from "vitest";
import robots from "./robots";
import { SITE } from "@/content/site";

describe("robots", () => {
  it("points to the sitemap and allows all crawling", () => {
    const result = robots();
    expect(result.sitemap).toBe(`${SITE.url}/sitemap.xml`);
    expect(result.rules).toMatchObject({ userAgent: "*", allow: "/" });
  });
});
