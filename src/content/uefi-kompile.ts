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
 *
 * Normal / Pro (owner's update, 2026-09-30): "a normal version (usable only
 * on your machine) or a PRO version (usable in any pc)", Normal "more
 * accessible ... for those who want to test out their bios and max them
 * out", Pro "lightly higher, but you can use this for tweaking purpose".
 * PRO 45€, Normal 25€, Normal -> Pro upgrade 21€, and "Added X3D Preset".
 * "Any PC" is worded as what the app does: every copy runs on the one PC it
 * is activated on; Pro also opens, edits and saves NVRAM exported from other
 * PCs, Normal only this PC's own.
 */

export type UefiKompileIcon = "depth" | "presets" | "latency" | "safe";

export type UefiKompilePlanId = "normal" | "pro";

export interface UefiKompilePlan {
  id: UefiKompilePlanId;
  name: string;
  /** Euros. */
  price: number;
  /** Who it is for, in two or three words - the card's tag. */
  audience: string;
  summary: string;
  points: string[];
}

export interface UefiKompileUpdate {
  title: string;
  body: string;
}

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
  /** Euros, as everything on the site is priced. Two versions since
   *  2026-09-30 (the single 48€ tool before), each with its 25 coins
   *  included; more coins are 10€ per 30. Display goes through money.ts, so
   *  US visitors see ≈$ beside the euros. */
  plans: [
    {
      id: "normal",
      name: "Normal",
      price: 25,
      audience: "For your own PC",
      summary: "The accessible way in: test your own BIOS and max it out.",
      points: [
        "Tunes this PC's BIOS only — the machine you activate",
        "Every preset: AM4, AM5, Intel and X3D",
        "25 coins included",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 45,
      audience: "For tweakers",
      summary: "A little more, made for tweaking: work on any PC's BIOS.",
      points: [
        "Everything in Normal",
        "Opens, tunes and saves NVRAM exported from any PC",
        "25 coins included",
      ],
    },
  ] as UefiKompilePlan[],
  upgrade: {
    price: 21,
    title: "Normal → Pro",
    line: "Already on Normal? Same PC, same account — we switch your plan and the app shows PRO within about a minute.",
  },
  freeCoins: 25,
  coinPack: { coins: 30, price: 10 },
  eyebrow: "BIOS optimization tool",
  tagline: "A low-level, automated tool for BIOS optimization.",
  heroSubtitle:
    "400–500 BIOS settings tuned in depth for extra low latency and smoothness, built to lift your 1% and 0.1% lows. Fully automated, so anyone can use it.",
  description:
    "Uefi-Kompile is a low-level, automated BIOS optimization tool: 400–500 settings tuned for low latency and smoother frames, automated presets for AM4, AM5, Intel and X3D, and 25 coins included. Normal 25€ for your own PC, Pro 45€ for any PC's BIOS.",

  updatesTitle: "Uefi-Kompile updates",
  updates: [
    {
      title: "Choose Normal or Pro",
      body: "Normal is for your own PC — the more accessible price, for testing your BIOS and maxing it out. Pro costs a little more and is made for tweaking: it works on any PC's BIOS.",
    },
    {
      title: "X3D preset added",
      body: "Ryzen X3D chips now get a recommended profile of their own in the Preset Manager.",
    },
  ] as UefiKompileUpdate[],

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

  pricingTitle: "Two versions, coins included.",
  pricingBody:
    "Normal keeps it simple and affordable: your own PC, every preset, maxed out. Pro is a little higher and made for tweaking — it opens and tunes BIOS exports from any PC.",
  coinPackLine: "Top up whenever you need to. Each Save or Export uses one coin.",

  steps: [
    { title: "Get it on Discord", body: "Open a ticket, pick Normal or Pro, pay, and we set you up with Uefi-Kompile." },
    { title: "Activate your PC", body: "Send the PC ID the app shows you. We add your PC, your plan and your 25 coins." },
    { title: "Run your preset", body: "Read your BIOS, pick AM4, AM5, Intel or X3D, review and write." },
  ] as UefiKompileStep[],

  closeTitle: "Tune the layer everyone else skips.",
  closeBody: "Open a ticket on Discord and we'll get Uefi-Kompile on your PC.",
  cta: "Get Uefi-Kompile",
};
