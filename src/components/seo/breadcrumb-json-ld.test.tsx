import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BreadcrumbJsonLd } from "./breadcrumb-json-ld";
import { SITE } from "@/content/site";

describe("BreadcrumbJsonLd", () => {
  it("renders a script tag with Home followed by the given crumbs", () => {
    const { container } = render(<BreadcrumbJsonLd crumbs={[{ name: "Services", path: "/services" }]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const data = JSON.parse(script!.innerHTML);
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Services", item: `${SITE.url}/services` },
    ]);
  });
});
