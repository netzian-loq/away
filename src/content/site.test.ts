import { describe, expect, it } from "vitest";
import { SITE } from "./site";

describe("SITE", () => {
  it("preserves the exact contact information", () => {
    expect(SITE.email).toBe("mattiaarminante77@gmail.com");
    expect(SITE.discordServerUrl).toBe("https://discord.gg/de5aXtGJ9a");
    expect(SITE.discordVouchesUrl).toBe("https://discord.gg/29Swpe8rM");
  });

  // Resend rejects a recipient that differs from the account address by case
  // alone, which silently killed every owner notification.
  it("keeps the contact address lowercase so Resend accepts it", () => {
    expect(SITE.email).toBe(SITE.email.toLowerCase());
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
