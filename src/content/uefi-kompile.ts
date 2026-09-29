/**
 * Uefi-Kompile — the automated BIOS optimization tool (the desktop app sold
 * as Away BIOS inside the tool itself). Copy is the owner's brief, 2026-09-29:
 * "a lowlevel automated tool for Bios Optimization", "400-500 settings for
 * in-depth Bios Tuning", "extra Low-Latency and Smoothness", "improve 1% lows
 * and 0.1", "automated preset for AM4-INTEL-AM5", "ANYONE can use this tool",
 * "fully automated", "25 Free Coins".
 *
 * Two lines are worded to match what the app provably does rather than as
 * guarantees: the lows are what it is BUILT to improve (no number is claimed),
 * and "without messing up" is stated as the app's real safeguards — changes
 * are staged, current values are backed up, nothing is written without a
 * confirmation. `page.test.tsx` guards against absolute safety or performance
 * promises creeping back in.
 */

export type UefiKompileIcon = "depth" | "presets" | "latency" | "safe";

export interface UefiKompileFeature {
  icon: UefiKompileIcon;
  title: string;
  body: string;
}

export interface UefiKompileStep {
  title: string;
  body: string;
}

export const UEFI_KOMPILE = {
  name: "Uefi-Kompile",
  path: "/uefi-kompile",
  eyebrow: "BIOS optimization tool",
  tagline: "A low-level, automated tool for BIOS optimization.",
  heroSubtitle:
    "400–500 BIOS settings tuned in depth for extra low latency and smoothness, built to lift your 1% and 0.1% lows. Fully automated, so anyone can use it.",
  description:
    "Uefi-Kompile is a low-level, automated BIOS optimization tool: 400–500 settings tuned for low latency and smoother frames, automated presets for AM4, AM5 and Intel, and 25 free coins included.",

  facts: [
    { value: "400–500", label: "BIOS settings tuned" },
    { value: "AM4 · AM5 · Intel", label: "Automated presets" },
    { value: "25", label: "Free coins included" },
  ],

  featuresTitle: "Deep BIOS tuning, without the guesswork.",
  featuresBody:
    "The BIOS is where latency is won or lost, and it is the layer most tuning never touches. Uefi-Kompile works through it for you.",
  features: [
    {
      icon: "depth",
      title: "In-depth BIOS tuning",
      body: "400–500 settings: idle and power states, latency, link speeds, memory and more — the low-level layer that decides how smooth a game feels.",
    },
    {
      icon: "presets",
      title: "Automated presets for AM4, AM5 and Intel",
      body: "Pick your platform and the preset sets every group for you. Ryzen X3D chips get a profile of their own.",
    },
    {
      icon: "latency",
      title: "Low latency, smoother frames",
      body: "Tuned for extra low latency and smoothness, built to improve your 1% and 0.1% lows — the stutters you actually feel.",
    },
    {
      icon: "safe",
      title: "Made so anyone can use it",
      body: "Fully automated. A preset stages its changes first; when you write them, your current values are backed up and nothing reaches the BIOS until you confirm.",
    },
  ] as UefiKompileFeature[],

  presetsTitle: "Pick a preset. Review it. Write it.",
  presetsBody:
    "Choose your platform — AM4, AM5, Intel or X3D — and every switch and tweak is set for you on screen. Nothing is applied until you press Write.",

  coinsTitle: "Comes with 25 free coins.",
  coinsBody: "Every Save or Export uses one coin, and you start with 25.",

  steps: [
    { title: "Get it on Discord", body: "Open a ticket and we set you up with Uefi-Kompile." },
    { title: "Activate your PC", body: "Send the PC ID the app shows you. We add your PC and your 25 coins." },
    { title: "Run your preset", body: "Read your BIOS, pick AM4, AM5, Intel or X3D, review and write." },
  ] as UefiKompileStep[],

  closeTitle: "Tune the layer everyone else skips.",
  closeBody: "Open a ticket on Discord and we'll get Uefi-Kompile on your PC.",
  cta: "Get Uefi-Kompile",
};
