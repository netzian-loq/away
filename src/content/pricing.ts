export interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  featured?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Standard",
    price: 35,
    description: "Essential optimization package for noticeable performance gains.",
    features: ["Windows Tuning", "BIOS Tuning"],
  },
  {
    name: "Entry Level",
    price: 45,
    description: "Great starting point with GPU overclocking included.",
    features: ["Windows Tuning", "BIOS Tuning", "GPU Overclocking"],
  },
  {
    name: "High Entry Level",
    price: 52,
    description: "CPU-focused package for processor-intensive workloads.",
    features: ["Windows Tuning", "BIOS Tuning", "CPU Overclocking"],
  },
  {
    name: "Pro Level",
    price: 65,
    featured: true,
    description: "Complete CPU and GPU overclocking for serious gamers.",
    features: ["Windows Tuning", "BIOS Tuning", "CPU Overclocking", "GPU Overclocking"],
  },
  {
    name: "Extreme Level",
    price: 90,
    description: "Maximum performance with full CPU, GPU and RAM overclocking.",
    features: ["Windows Tuning", "BIOS Tuning", "CPU Overclocking", "GPU Overclocking", "RAM Overclocking"],
  },
];
