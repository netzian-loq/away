export interface WhyReason {
  title: string;
  description: string;
}

/**
 * No `icon` field. These used to carry a lucide icon each, rendered beside the
 * heading — a trophy for "Experienced Optimization", a rocket for "Maximum
 * Efficiency". They were decoration standing in for meaning, and the list that
 * renders them is numbered now, so the imports went with them.
 */
export const WHY_REASONS: WhyReason[] = [
  {
    title: "Experienced Optimization",
    description: "Years of competitive PC tuning across every major esports title.",
  },
  {
    title: "Safe Tweaks",
    description: "Reversible changes, full backups, and a stability-first methodology.",
  },
  {
    title: "Custom Configurations",
    description: "No copy-paste presets — every config tailored to your hardware.",
  },
  {
    title: "Competitive Focus",
    description: "Tuned for ranked play, tournaments and high-refresh-rate setups.",
  },
  {
    title: "Reliable Support",
    description: "Post-service support and re-tuning whenever your hardware changes.",
  },
  {
    title: "Maximum Efficiency",
    description: "Every watt, cycle and clock pushed toward in-game performance.",
  },
  {
    title: "Premium Process",
    description: "Diagnostics, tune, validate, document. Every step transparent.",
  },
];
