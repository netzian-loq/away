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

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <Hero />
      {/* The keyword marquee that used to sit here was removed: an infinite
          26s scroll of "FPS BOOST · LOW LATENCY · …" repeated the services
          section's content as decoration, and never stopped moving. */}
      <Manifesto />
      <VideoShowcase />
      <ServicesTeaser />
      <WhyUs />
      <PricingTable />
      <VouchesCTA />
      <FreeUtility />
      <FinalCTA />
    </>
  );
}
