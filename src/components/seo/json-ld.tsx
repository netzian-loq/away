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
        "@type": "ProfessionalService",
        "@id": `${SITE.url}/#business`,
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        priceRange: "€€",
        areaServed: { "@type": "Place", name: "Worldwide" },
        sameAs: [SITE.discordServerUrl],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "PC Optimization Services",
          itemListElement: SERVICES.map((service) => ({
            "@type": "Offer",
            priceCurrency: "EUR",
            price: String(service.priceValue),
            itemOffered: { "@type": "Service", name: service.title, description: service.summary },
          })),
        },
      },
    ],
  };

  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
