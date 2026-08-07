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
    price: 35,
    description: "Essential optimization package for noticeable performance gains.",
    features: ["Windows Tuning", "BIOS Tuning"],
  },
  {
    slug: "entry-level",
    name: "Entry Level",
    price: 45,
    description: "Great starting point with GPU overclocking included.",
    features: ["Windows Tuning", "BIOS Tuning", "GPU Overclocking"],
  },
  {
    slug: "high-entry-level",
    name: "High Entry Level",
    price: 52,
    description: "CPU-focused package for processor-intensive workloads.",
    features: ["Windows Tuning", "BIOS Tuning", "CPU Overclocking"],
  },
  {
    slug: "pro-level",
    name: "Pro Level",
    price: 65,
    featured: true,
    description: "Complete CPU and GPU overclocking for serious gamers.",
    features: ["Windows Tuning", "BIOS Tuning", "CPU Overclocking", "GPU Overclocking"],
  },
  {
    slug: "extreme-level",
    name: "Extreme Level",
    price: 95,
    description: "Maximum performance with full CPU, GPU and RAM overclocking.",
    features: ["Windows Tuning", "BIOS Tuning", "CPU Overclocking", "GPU Overclocking", "RAM Overclocking"],
  },
];

/** Currency every package is priced and charged in. */
export const CURRENCY = "EUR";

/** Server-side price lookup — the browser only ever sends a slug. */
export function findTier(slug: string | null | undefined) {
  if (!slug) return null;
  return PRICING_TIERS.find((tier) => tier.slug === slug.trim().toLowerCase()) ?? null;
}
