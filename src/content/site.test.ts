import { describe, expect, it } from "vitest";
import { SITE } from "./site";

describe("SITE", () => {
  it("preserves the exact contact information", () => {
    expect(SITE.email).toBe("Mattiaarminante77@gmail.com");
    expect(SITE.discordServerUrl).toBe("https://discord.gg/saKde8DD9");
    expect(SITE.discordVouchesUrl).toBe("https://discord.gg/29Swpe8rM");
  });

  it("has nav links for the 4 pages plus the free-tool anchor", () => {
    expect(SITE.nav.map((n) => n.href)).toEqual([
      "/",
      "/services",
      "/about",
      "/#utility",
      "/contact",
    ]);
  });

  it("has 4 hero stats", () => {
    expect(SITE.stats).toHaveLength(4);
  });
});
