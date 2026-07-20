import type { LucideIcon } from "lucide-react";
import { Trophy, Shield, Layers, Cpu, Headphones, Rocket, Sparkles } from "lucide-react";

export interface WhyReason {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const WHY_REASONS: WhyReason[] = [
  { icon: Trophy, title: "Experienced Optimization", description: "Years of competitive PC tuning across every major esports title." },
  { icon: Shield, title: "Safe Tweaks", description: "Reversible changes, full backups, and a stability-first methodology." },
  { icon: Layers, title: "Custom Configurations", description: "No copy-paste presets — every config tailored to your hardware." },
  { icon: Cpu, title: "Competitive Focus", description: "Tuned for ranked play, tournaments and high-refresh-rate setups." },
  { icon: Headphones, title: "Reliable Support", description: "Post-service support and re-tuning whenever your hardware changes." },
  { icon: Rocket, title: "Maximum Efficiency", description: "Every watt, cycle and clock pushed toward in-game performance." },
  { icon: Sparkles, title: "Premium Process", description: "Diagnostics, tune, validate, document. Every step transparent." },
];
