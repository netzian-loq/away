export interface PricingTier {
  /** Stable id the checkout sends; prices are looked up from it server-side. */
  slug: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  featured?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    slug: "standard",
    name: "Standard",
    price: 38,
    description: "Essential optimization package for noticeable performance gains.",
    features: ["Windows Tuning", "BIOS Full Tuning"],
  },
  {
    slug: "entry-level",
    name: "Low Entry Level",
    price: 50,
    description: "Great starting point with GPU overclocking included.",
    features: ["Windows Tuning", "BIOS Full Tuning", "GPU Overclocking"],
  },
  {
    slug: "high-entry-level",
    name: "High Entry Level",
    price: 55,
    description: "CPU-focused package for processor-intensive workloads.",
    features: ["Windows Tuning", "BIOS Full Tuning", "CPU Overclocking"],
  },
  {
    slug: "pro-level",
    name: "Pro Level",
    price: 70,
    featured: true,
    description: "Complete CPU and GPU overclocking for serious gamers.",
    features: ["Windows Tuning", "BIOS Full Tuning", "CPU Overclocking", "GPU Overclocking"],
  },
  {
    slug: "extreme-level",
    name: "Extreme Level",
    price: 105,
    description: "Maximum performance with full CPU, GPU and RAM overclocking.",
    features: [
      "Windows Tuning",
      "BIOS Full Tuning",
      "CPU Overclocking",
      "GPU Overclocking",
      "RAM Overclocking",
    ],
  },
];

/**
 * Optional upgrade on any package: swap the Windows tune it includes for the
 * extreme one.
 *
 * Priced as an upgrade, not as the item — standalone the difference is 5€
 * (25 → 30), inside a package it is 4€. It applies to packages only; a
 * single service is bought as the extreme version directly, and offering the
 * upgrade there would be selling the same thing twice.
 */
export const EXTREME_UPGRADE = {
  slug: "extreme-windows",
  name: "Extreme Windows Tuning",
  price: 4,
  note: "Kernel, scheduler and dxgkrnl tuning, aggressive service strip, per-game configuration.",
} as const;

/** Currency every package is priced and charged in. */
export const CURRENCY = "EUR";

/** Server-side price lookup — the browser only ever sends a slug. */
export function findTier(slug: string | null | undefined) {
  if (!slug) return null;
  return PRICING_TIERS.find((tier) => tier.slug === slug.trim().toLowerCase()) ?? null;
}
