import { describe, expect, it } from "vitest";
import { SITE } from "./site";

describe("SITE", () => {
  it("preserves the exact contact information", () => {
    expect(SITE.email).toBe("Mattiaarminante77@gmail.com");
    expect(SITE.discordServerUrl).toBe("https://discord.gg/saKde8DD9");
    expect(SITE.discordVouchesUrl).toBe("https://discord.gg/29Swpe8rM");
  });

  it("has exactly 4 nav links matching the site's 4 pages", () => {
    expect(SITE.nav.map((n) => n.href)).toEqual(["/", "/services", "/about", "/contact"]);
  });

  it("has 4 hero stats", () => {
    expect(SITE.stats).toHaveLength(4);
  });
});
