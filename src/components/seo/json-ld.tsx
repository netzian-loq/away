import { PRICING_TIERS } from "@/content/pricing";
import { SERVICES } from "@/content/services";
import { SITE } from "@/content/site";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: "en",
      },
      {
        // OnlineBusiness rather than ProfessionalService: the latter is a
        // LocalBusiness subtype, which implies an address and opening hours
        // a remote-only service does not have.
        "@type": "OnlineBusiness",
        "@id": `${SITE.url}/#business`,
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        logo: `${SITE.url}/logo-mark.png`,
        image: `${SITE.url}/opengraph-image.png`,
        // Real profile pages only; a Discord invite is not a profile.
        sameAs: [SITE.xUrl, SITE.youtubeUrl],
        priceRange: "€€",
        areaServed: { "@type": "Place", name: "Worldwide" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "PC Optimization Services",
          itemListElement: [
            ...PRICING_TIERS.map((tier) => ({
              "@type": "Offer",
              priceCurrency: "EUR",
              price: String(tier.price),
              url: `${SITE.url}/checkout?item=${tier.slug}`,
              itemOffered: {
                "@type": "Service",
                name: `${tier.name} package`,
                description: `${tier.description} Includes ${tier.features.join(", ")}.`,
              },
            })),
            ...SERVICES.map((service) => ({
              "@type": "Offer",
              priceCurrency: "EUR",
              price: String(service.priceValue),
              url: `${SITE.url}/checkout?item=${service.slug}`,
              itemOffered: { "@type": "Service", name: service.title, description: service.summary },
            })),
          ],
        },
      },
    ],
  };

  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
