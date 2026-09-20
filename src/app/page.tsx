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
      {/* Services come first, directly under the hero.
          ------------------------------------------------------------------
          They used to sit fourth, behind the manifesto and the video, which
          put two full-height sections of atmosphere between someone arriving
          and anything they could actually buy. What people want to know on
          arrival is what is sold and what it costs — every card is priced and
          links straight into checkout with that service selected.

          The keyword marquee that used to sit here was removed separately: an
          infinite 26s scroll of "FPS BOOST · LOW LATENCY · …" repeated the
          services section as decoration, and never stopped moving. */}
      <ServicesTeaser currency={currency} />
      <Manifesto />
      <VideoShowcase />
      <WhyUs />
      <PricingTable currency={currency} />
      <VouchesCTA />
      <FreeUtility />
      <FinalCTA />
    </>
  );
}
