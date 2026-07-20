export interface MethodStep {
  title: string;
  body: string;
}

export const ABOUT = {
  eyebrow: "About Away Tweaks",
  heroTitle: "We tune PCs for a living — not as a side hustle.",
  heroBody:
    "Away Tweaks started the way most performance obsessions do: not being satisfied with " +
    "\"it runs fine.\" What began as tuning our own rigs for ranked play turned into doing it " +
    "for other competitive players, then into a private optimization service with its own " +
    "custom gaming OS. The goal has never changed — take a PC that's leaving performance on " +
    "the table and get every last frame and millisecond out of it, safely and reversibly.",
  missionTitle: "Our mission",
  missionBody:
    "Most PCs run at a fraction of what their hardware can do — buried under bloat, default " +
    "BIOS settings, and generic driver configs that were never tuned for gaming. We exist to " +
    "close that gap: full-stack tuning from the operating system down to the silicon, so your " +
    "hardware performs like you paid for it to.",
  methodSteps: [
    {
      title: "Diagnose",
      body: "Every engagement starts with a full audit of your current setup — OS, BIOS, drivers, thermals and network — so we know exactly where performance is being left on the table before we touch anything.",
    },
    {
      title: "Tune",
      body: "We apply custom configuration at every layer that matters: Windows and kernel tuning, BIOS settings, CPU/GPU/RAM overclocking profiles, and network stack tuning — built for your exact hardware, never a copy-paste preset.",
    },
    {
      title: "Validate",
      body: "Every change is stress-tested and benchmarked before and after, often over hours, to confirm real stability under sustained load — not just a clean boot.",
    },
    {
      title: "Support",
      body: "You keep a safe rollback profile and direct access to us on Discord for re-tuning whenever your hardware, games, or drivers change.",
    },
  ] as MethodStep[],
  ctaTitle: "Want the same tune?",
  ctaBody: "Tell us about your rig and what you play — we'll come back with a plan within 24 hours.",
};
