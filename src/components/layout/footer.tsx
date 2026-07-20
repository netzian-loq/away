import Link from "next/link";
import { Disc } from "lucide-react";
import { SITE } from "@/content/site";
import { SERVICES } from "@/content/services";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl ring-1 ring-electric/40">
                <img src="/logo.svg" alt="Away Tweaks logo" className="h-full w-full object-cover" />
              </span>
              <span className="font-display text-lg font-bold">
                Away<span className="text-electric"> Tweaks</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Elite PC optimization, custom gaming OS builds, and overclocking for competitive
              players who want their hardware to keep up with their skill.
            </p>
            <a
              href={SITE.discordServerUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Away Tweaks Discord"
              className="glass mt-5 grid h-9 w-9 place-items-center rounded-lg hover:border-electric/50 hover:text-electric"
            >
              <Disc className="h-4 w-4" />
            </a>
          </div>

          <div>
            <div className="font-display text-sm font-semibold">Quick Links</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {SITE.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-electric">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-display text-sm font-semibold">Services</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link href="/services" className="hover:text-electric">
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-muted-foreground sm:flex-row">
          <div>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-5">
            <Link href="/services" className="hover:text-electric">Services</Link>
            <Link href="/#pricing" className="hover:text-electric">Pricing</Link>
            <Link href="/contact" className="hover:text-electric">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
