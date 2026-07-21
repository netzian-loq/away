import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { AppPreviewScroll } from "@/components/sections/app-preview-scroll";
import { TuningBenchmark } from "@/components/sections/tuning-benchmark";
import { TrustMarquee } from "@/components/sections/trust-marquee";
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
      <AppPreviewScroll />
      <TuningBenchmark />
      <TrustMarquee />
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
