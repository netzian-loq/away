import { OVERTUNER } from "@/content/overtuner";
import { PRICING_TIERS } from "@/content/pricing";
import { SERVICES } from "@/content/services";
import { SITE } from "@/content/site";
import { UEFI_KOMPILE } from "@/content/uefi-kompile";

/**
 * /llms.txt, built from the same content files the pages read.
 *
 * It used to be a hand-written file in /public and had drifted: old prices,
 * a link to the retired contact page, a dead Discord invite and neither app.
 * AI search engines quote this file, so a stale copy means wrong prices in
 * their answers. Generated here, it cannot disagree with the site.
 */
export const dynamic = "force-static";

export function GET() {
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    "Away Tweaks is a private PC tuning and optimization service for competitive players. Sessions are one to one and booked on Discord. You keep your Windows install, every change is backed up and reversible, and nothing is signed off until it has held stable under load.",
    "",
    "## Pages",
    `- Home, packages and prices: ${SITE.url}/`,
    `- Every service in detail: ${SITE.url}/services`,
    `- ${UEFI_KOMPILE.name} (BIOS optimization tool): ${SITE.url}${UEFI_KOMPILE.path}`,
    `- ${OVERTUNER.name} (GPU and system tuning app): ${SITE.url}${OVERTUNER.path}`,
    `- About: ${SITE.url}/about`,
    "",
    "## Packages",
    ...PRICING_TIERS.map((tier) => `- ${tier.name} (${tier.price}€): ${tier.features.join(", ")}. ${tier.description}`),
    "",
    "## Single services",
    ...SERVICES.map((service) => `- ${service.title} (${service.priceValue}€): ${service.summary}`),
    "",
    "## Software",
    `- ${UEFI_KOMPILE.name}: ${UEFI_KOMPILE.description}`,
    `- ${OVERTUNER.name}: ${OVERTUNER.description}`,
    "",
    "## Contact",
    `- Discord server: ${SITE.discordServerUrl}`,
    `- Client vouches: ${SITE.discordVouchesUrl}`,
    `- Orders and support tickets: ${SITE.discordSupportUrl}`,
    `- Website: ${SITE.url}/`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
