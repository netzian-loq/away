import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { ServicesFull } from "@/components/sections/services-full";
import { PricingTable } from "@/components/sections/pricing-table";
import { FinalCTA } from "@/components/sections/final-cta";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { SITE } from "@/content/site";

const TITLE = "Services & Pricing";
const DESCRIPTION =
  "Windows tuning, custom gaming OS, CPU/GPU/RAM overclocking, network and BIOS tuning — every Away Tweaks service in detail, with pricing.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/services` },
  openGraph: {
    title: `${TITLE} — ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/services`,
  },
};

export default function ServicesPage() {
  return (
    <>
      <BreadcrumbJsonLd crumbs={[{ name: "Services", path: "/services" }]} />
      <section className="relative pt-40 pb-16 sm:pt-48">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Services</span>
            <h1 className="mt-4 font-display text-4xl font-bold text-gradient sm:text-5xl">
              Every tune we run, in detail.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              No copy-paste presets. Every service below is a hands-on tune, validated for hours
              against your exact hardware.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <ServicesFull />
        </div>
      </section>

      <PricingTable />
      <FinalCTA />
    </>
  );
}
