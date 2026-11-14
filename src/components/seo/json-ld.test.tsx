import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonLd } from "./json-ld";
import { PRICING_TIERS } from "@/content/pricing";
import { SERVICES } from "@/content/services";
import { SITE } from "@/content/site";

describe("JsonLd", () => {
  it("embeds a script tag with an offer for every package and service", () => {
    const { container } = render(<JsonLd />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const data = JSON.parse(script!.innerHTML);
    const offers = data["@graph"][1].hasOfferCatalog.itemListElement;
    expect(offers).toHaveLength(PRICING_TIERS.length + SERVICES.length);
  });

  it("declares an online business whose every offer links into checkout", () => {
    const { container } = render(<JsonLd />);
    const data = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.innerHTML);
    const business = data["@graph"][1];
    expect(business["@type"]).toBe("OnlineBusiness");
    expect(business.sameAs).toBeUndefined();
    const urls = business.hasOfferCatalog.itemListElement.map((offer: { url: string }) => offer.url);
    expect(urls).toEqual([
      ...PRICING_TIERS.map((tier) => `${SITE.url}/checkout?item=${tier.slug}`),
      ...SERVICES.map((service) => `${SITE.url}/checkout?item=${service.slug}`),
    ]);
  });
});
