import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonLd } from "./json-ld";
import { SERVICES } from "@/content/services";

describe("JsonLd", () => {
  it("embeds a script tag with an offer for every service", () => {
    const { container } = render(<JsonLd />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const data = JSON.parse(script!.innerHTML);
    const offers = data["@graph"][1].hasOfferCatalog.itemListElement;
    expect(offers).toHaveLength(SERVICES.length);
  });
});
