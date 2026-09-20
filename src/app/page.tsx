import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { Manifesto } from "@/components/sections/manifesto";
import { VideoShowcase } from "@/components/sections/video-showcase";
import { ServicesTeaser } from "@/components/sections/services-teaser";
import { WhyUs } from "@/components/sections/why-us";
import { PricingTable } from "@/components/sections/pricing-table";
import { VouchesCTA } from "@/components/sections/vouches-cta";
import { FreeUtility } from "@/components/sections/free-utility";
import { FinalCTA } from "@/components/sections/final-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE } from "@/content/site";
import { getDisplayCurrency } from "@/lib/currency.server";

export const metadata: Metadata = {
  title: `${SITE.name} — Elite PC Optimization for Competitive Gamers`,
  description: SITE.description,
  alternates: { canonical: SITE.url },
  openGraph: {
    title: `${SITE.name} — Elite PC Optimization for Competitive Gamers`,
    description: SITE.description,
    url: SITE.url,
  },
};

export default async function HomePage() {
  // Resolved once per request and handed down, so the thirty-odd prices on
  // this page all agree with each other.
  const currency = await getDisplayCurrency();

  return (
    <>
      <JsonLd />
      <Hero />
      {/* What is for sale comes first, directly under the hero.
          ------------------------------------------------------------------
          Both commercial sections used to sit behind the manifesto and the
          video, which put two full-height sections of atmosphere between
          someone arriving and anything they could actually buy.

          Packages lead, single services follow. A package is the larger
          order and the better deal, and it only reads as a deal next to what
          its parts cost separately — which is exactly what the section below
          it lists. Leading with the singles inverted that: it anchored every
          visitor on the cheapest line before they saw a bundle.

          The keyword marquee that used to sit here was removed separately: an
          infinite 26s scroll of "FPS BOOST · LOW LATENCY · …" repeated the
          services section as decoration, and never stopped moving. */}
      <PricingTable currency={currency} />
      <ServicesTeaser currency={currency} />
      <Manifesto />
      <VideoShowcase />
      <WhyUs />
      <VouchesCTA />
      <FreeUtility />
      <FinalCTA />
    </>
  );
}
