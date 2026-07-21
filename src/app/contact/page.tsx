import type { Metadata } from "next";
import { Mail, Disc, HardDrive } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/sections/contact-form";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Tell Away Tweaks about your rig and what you play — get a tailored PC optimization plan within 24 hours.",
  alternates: { canonical: `${SITE.url}/contact` },
};

export default function ContactPage() {
  return (
    <section className="relative pt-40 pb-24 sm:pt-48">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="glass-strong rounded-3xl border border-white/10 p-8 sm:p-14">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Contact</span>
              <h1 className="mt-4 font-display text-3xl font-bold text-gradient sm:text-4xl">
                Ready to maximize your gaming performance?
              </h1>
              <p className="mt-4 text-muted-foreground">
                Tell us about your rig and what you play. We&apos;ll come back with a tailored
                optimization plan within 24 hours.
              </p>
              <div className="mt-8 space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4 text-electric" />
                  <a href={`mailto:${SITE.email}`} className="break-all hover:text-electric">
                    {SITE.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Disc className="h-4 w-4 text-electric" />
                  <a href={SITE.discordServerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-electric">
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
  );
}
