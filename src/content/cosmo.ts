/**
 * Copy for the Cosmo eSports partner page (/cosmo). Cosmo shares this URL
 * directly with their community, so the page has to stand on its own without
 * any query string carrying the partner identity — the discount code does
 * that job instead (see @/lib/discounts).
 */

/** A run of body copy. `strong` segments render bold inline. */
export interface CopySegment {
  text: string;
  strong?: boolean;
}

export interface CosmoPillar {
  /** Maps to a lucide icon in the page; keeps content free of JSX. */
  icon: "pathway" | "standards" | "community";
  title: string;
  body: string;
}

export const COSMO = {
  eyebrow: "Who We Are",
  heroTitle: "About Cosmo eSports",
  heroSubtitle:
    "Away Tweaks is the official performance partner of Cosmo eSports — same tuning we run for competitive players, at a Cosmo-only price.",

  aboutParagraphs: [
    [
      {
        text: "Cosmo eSports is a competitive Fortnite organization built around one idea: talent deserves a clear path to the top. We run ",
      },
      { text: "seven structured rosters", strong: true },
      {
        text: ", from Grinder+ all the way up to our Pro roster, so every player — whether they're chasing their first placement or already stacking wins — knows exactly what the next step looks like.",
      },
    ],
    [
      { text: "No shortcuts, no politics. Just consistency, reps, and results. We call it " },
      { text: "Reach Beyond", strong: true },
      {
        text: ", and it's less a slogan than a standard we hold every grinder in the org to, from our newest Academy signee to our Pro squad.",
      },
    ],
  ] as CopySegment[][],

  pillars: [
    {
      icon: "pathway",
      title: "Player Pathway",
      body: "Seven tiers, one staircase. Every roster exists to get you ready for the next.",
    },
    {
      icon: "standards",
      title: "Competitive Standards",
      body: "Attendance, PR, and in-game conduct are tracked. Consistency earns you your seat.",
    },
    {
      icon: "community",
      title: "Community First",
      body: "A Discord-first org where staff, coaches, and players actually talk to each other.",
    },
  ] as CosmoPillar[],

  /** Feeds the DiscountCode block. The code itself lives in @/lib/discounts. */
  offer: {
    eyebrow: "Away Tweaks x Cosmo",
    body:
      "Cosmo players and community get a cut on Away Tweaks — the PC optimization service " +
      "that keeps your rig scrim-ready. Drop the code at checkout and the discount is yours.",
    label: "Use code",
    hint: "Tap to copy",
  },

  ctaTitle: "Ready to stop losing frames?",
  ctaBody:
    "Pick a package, paste your Cosmo code at checkout, and pay straight through the site — no ticket needed.",
};
