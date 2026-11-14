import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/content/site";
import { CheckoutLink } from "@/components/layout/checkout-link";
import { SERVICES } from "@/content/services";
import { Icon3d, type Icon3dName } from "@/components/ui/icon-3d";

const SOCIALS: { name: string; href: string; icon: Icon3dName }[] = [
  { name: "YouTube", href: SITE.youtubeUrl, icon: "social-youtube" },
  { name: "X", href: SITE.xUrl, icon: "social-x" },
  { name: "Discord", href: SITE.discordServerUrl, icon: "social-discord" },
];

const linkClass = "tap-target text-[15px] text-muted-foreground transition-colors hover:text-foreground";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  );
}

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

/**
 * Brand on the left, four link columns on the right, then the name set very
 * large and very faint across the full width with the copyright line under a
 * rule. The wordmark is decoration: it is hidden from assistive tech and cut
 * off by the footer rather than allowed to widen the page on a phone.
 *
 * Only pages that exist are linked. There is no legal column because the site
 * has no terms, privacy or refund pages to point at.
 */
export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/5 pt-16 sm:pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
          <div className="min-w-0">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full ring-1 ring-white/15">
                <Image src="/logo-mark.png" alt="Away Tweaks logo" width={40} height={40} className="h-full w-full object-cover" />
              </span>
              <span className="font-display text-lg font-bold">
                Away<span className="text-electric"> Tweaks</span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
              PC optimization for competitive players. Every change backed up and reversible.
            </p>
            <ul className="mt-6 -ml-1.5 flex items-center gap-1">
              {SOCIALS.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Away Tweaks on ${social.name}`}
                    className="grid h-14 w-14 place-items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
                  >
                    <Icon3d name={social.icon} size={52} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            <Column title="Products">
              <li><Link href="/#pricing" className={linkClass}>Packages</Link></li>
              <li><Link href="/services" className={linkClass}>Single services</Link></li>
              <li><Link href="/uefi-kompile" className={linkClass}>Uefi-Kompile</Link></li>
              <li><Link href="/overtuner" className={linkClass}>OverTuner</Link></li>
              <li><Link href="/#utility" className={linkClass}>Away Utility (free)</Link></li>
              <li><CheckoutLink className={linkClass}>Buy</CheckoutLink></li>
            </Column>

            <Column title="Services">
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link href={`/services#${service.slug}`} className={linkClass}>
                    {service.title}
                  </Link>
                </li>
              ))}
            </Column>

            <Column title="Company">
              <li><Link href="/about" className={linkClass}>About</Link></li>
              <li><Link href="/services#faq" className={linkClass}>Questions</Link></li>
            </Column>

            <Column title="Community">
              <li><External href={SITE.discordServerUrl}>Discord</External></li>
              <li><External href={SITE.discordSupportUrl}>Open a ticket</External></li>
              <li><External href={SITE.youtubeUrl}>YouTube</External></li>
              <li><External href={SITE.xUrl}>X</External></li>
            </Column>
          </nav>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none mt-14 select-none text-center font-display text-[clamp(3rem,14.5vw,12.5rem)] leading-none font-bold tracking-[-0.05em] whitespace-nowrap text-white/[0.045]"
        >
          Away Tweaks
        </div>

        <div className="border-t border-white/8 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
