import { SITE } from "@/content/site";

interface SoftwareJsonLdProps {
  name: string;
  path: string;
  description: string;
  /** Path of a screenshot under /public. */
  image: string;
  /** Lowest price in euros. */
  price: number;
  /** Extra wording for the offer, e.g. "Per year". */
  priceNote?: string;
  /** ISO 8601 duration the price covers, e.g. "P1Y" for a yearly licence. */
  billingDuration?: string;
}

/**
 * SoftwareApplication structured data for the two apps sold on the site, so a
 * search result can show them as software with a price rather than as a
 * generic page. No rating is declared: there is no on-page review data to
 * back one, and an unbacked rating is what search engines penalise.
 */
export function SoftwareJsonLd({
  name,
  path,
  description,
  image,
  price,
  priceNote,
  billingDuration,
}: SoftwareJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    url: `${SITE.url}${path}`,
    description,
    image: `${SITE.url}${image}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows 10, Windows 11",
    // Inline rather than an @id reference: the business node is only emitted
    // on the home page, so a reference from here would point at nothing.
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    offers: {
      "@type": "Offer",
      price: String(price),
      priceCurrency: "EUR",
      url: `${SITE.url}${path}`,
      ...(priceNote ? { description: priceNote } : {}),
      ...(billingDuration
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: String(price),
              priceCurrency: "EUR",
              billingDuration,
            },
          }
        : {}),
    },
  };

  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
