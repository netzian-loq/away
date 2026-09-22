/**
 * Copy for the Jesterfv1 creator page (/jesterfv1). He shares this URL with
 * his community directly, so the page stands on its own; the partner identity
 * travels in the discount code, not in a query string (see @/lib/discounts).
 *
 * What this copy does NOT say: that Jesterfv1 personally runs an Away Tweaks
 * tune. That would be a factual claim about a real person, and nobody here has
 * confirmed it. The pitch is aspirational instead: his viewers want to play
 * like him, and a rig that stutters in endgame is the part of that they can
 * actually buy. If he agrees to endorse it in his own words, add it here and
 * the page gets stronger. page.test.tsx guards the wording either way.
 *
 * No em-dashes anywhere in the visible copy. Short sentences read faster on a
 * phone, which is where a link from a stream gets opened.
 */

export interface CreatorPillar {
  /** Maps to a lucide icon in the page; keeps content free of JSX. */
  icon: "aim" | "frames" | "endgame";
  title: string;
  body: string;
}

export const JESTERFV = {
  eyebrow: "Jesterfv1 × Away Tweaks",
  heroTitle: "Play like Jesterfv1.",
  /** Hero subtext. Kept under 20 words so the CTA sits above the fold. */
  heroSubtitle:
    "Skill takes reps. A PC that drops frames mid box fight is fixable today. His viewers get 5% off.",

  pricesTitle: "Your price on every package.",
  pricesBody: "The discount is already taken off. Pick one and it opens in checkout with the code on.",

  whyTitle: "Where fights are actually lost.",
  whyBody:
    "Aim is practice. But input delay, dropped frames and endgame stutter decide a fight before your crosshair gets there. That part we fix.",

  pillars: [
    {
      icon: "aim",
      title: "Input delay",
      body: "The gap between your flick and the server seeing it. BIOS, network and Windows, each tuned to add nothing.",
    },
    {
      icon: "frames",
      title: "The frame floor",
      body: "Average FPS is a marketing number. The fight is decided by your worst frame when a third team shows up.",
    },
    {
      icon: "endgame",
      title: "Endgame stability",
      body: "Full lobby, builds everywhere, everyone in one zone. That is when a stock install folds and a tuned one holds.",
    },
  ] as CreatorPillar[],

  closeTitle: "Stop losing fights to your own PC.",
  closeBody: "Your 5% is waiting in checkout. After you pay, a ticket on Discord books your session.",
};
