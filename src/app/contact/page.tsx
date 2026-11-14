import type { Metadata } from "next";
import { Mail, Disc, HardDrive } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/sections/contact-form";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { OG_BASE, SITE } from "@/content/site";

const TITLE = "Contact";
const DESCRIPTION =
  "Tell Away Tweaks about your rig and what you play and get a tailored PC optimization plan within 24 hours.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/contact` },
  // Off the nav and the sitemap since the form gave way to Discord; still
  // reachable, but not a page to rank.
  robots: { index: false, follow: true },
  openGraph: {
    ...OG_BASE,
    title: `${TITLE} | ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/contact`,
  },
};

export default function ContactPage() {
  return (
    <>
      <BreadcrumbJsonLd crumbs={[{ name: "Contact", path: "/contact" }]} />
      <section className="relative pt-40 pb-24 sm:pt-48">
        <div aria-hidden="true" className="stage" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="glass-strong rounded-3xl border border-white/10 p-8 sm:p-14">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <h1 className="font-display text-3xl font-bold text-gradient sm:text-4xl">
                Ready to maximize your gaming performance?
              </h1>
              <p className="mt-4 text-muted-foreground">
                Tell us about your rig and what you play. We&apos;ll come back with a tailored
                optimization plan within 24 hours.
              </p>
              <div className="mt-8 space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4 text-electric" />
                  <a href={`mailto:${SITE.email}`} className="tap-target break-all hover:text-electric">
                    {SITE.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Disc className="h-4 w-4 text-electric" />
                  <a href={SITE.discordServerUrl} target="_blank" rel="noopener noreferrer" className="tap-target hover:text-electric">
                    Join our Discord
                  </a>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <HardDrive className="h-4 w-4 text-electric" /> Remote sessions worldwide
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <ContactForm />
            </div>
          </div>
        </Reveal>
      </div>
      </section>
    </>
  );
}
