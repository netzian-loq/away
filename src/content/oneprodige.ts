/**
 * Copy and facts for the One Prodige (1P) partner page (/oneprodige).
 *
 * Every fact below is taken from their own site, oneprodige.com, as read on
 * 2026-10-05: the tagline, founding year, EU rank, FNCS record, the road to
 * Globals and the official social links. Their site is French; this page is
 * English like the rest of awaytweaks.com, so the lines are translated, not
 * invented. When their results move on, update `road` and `facts` here.
 *
 * What this copy does NOT say: that 1P's players run an Away Tweaks tune.
 * That is a factual claim about real people nobody here has confirmed. The
 * pitch is that their community can fix the part of its game a PC decides.
 * page.test.tsx guards the wording.
 *
 * No em-dashes in the visible copy, same rule as the other partner pages.
 */

export interface OnePFact {
  value: string;
  label: string;
}

export interface OnePRoadStep {
  event: string;
  date: string;
  /** Each player 1P sent to the event and where they placed. */
  results: { player: string; country: string; place: string; note?: string }[];
}

export interface OnePSocial {
  platform: "x" | "instagram" | "twitch" | "tiktok" | "youtube" | "discord";
  name: string;
  handle: string;
  href: string;
}

export const ONE_PRODIGE = {
  name: "One Prodige",
  short: "1P",
  site: "https://oneprodige.com",
  /** Their own line, from the title of oneprodige.com. */
  tagline: "Performance & Excellence",
  eyebrow: "One Prodige × Away Tweaks",
  /** Hero subtext. Kept under 20 words so the CTA sits above the fold. */
  heroSubtitle:
    "The 1P community gets 5% off every package. Higher frame floor, lower input delay, cleaner endgames.",

  /** Their "Notre ADN" line, translated. */
  dna: "An esports team built for performance and excellence on Fortnite.",
  /** Their footer line, translated. */
  about:
    "The French elite of competitive Fortnite. Roster, coaching and broadcast production, all in one place.",

  facts: [
    { value: "2025", label: "Founded" },
    { value: "#33", label: "EU team" },
    { value: "2×", label: "FNCS Grand Finals" },
    { value: "Globals", label: "Qualified" },
  ] as OnePFact[],

  roadTitle: "The road to the top",
  road: [
    {
      event: "Erazer LAN, Hamburg",
      date: "25 October 2025",
      results: [{ player: "Alvinir", country: "DE", place: "28th" }],
    },
    {
      event: "First Major Final",
      date: "25 and 26 April 2026",
      results: [{ player: "Glub", country: "UK", place: "32nd" }],
    },
    {
      event: "Second Major Final",
      date: "1 and 2 August 2026",
      results: [
        { player: "Julle", country: "FI", place: "13th", note: "Qualified for Globals" },
        { player: "Lericx", country: "DK", place: "49th" },
      ],
    },
  ] as OnePRoadStep[],
  /** Their "Prochaine étape" line. */
  next: { label: "Next stop", body: "Antwerp, for the Globals, with Julle." },

  pricesTitle: "Your 1P price on every package.",
  pricesBody: "The 5% is already taken off. Pick one and it opens in checkout with the code on.",

  whyTitle: "Grind like a roster. Play on a tuned PC.",
  whyBody:
    "A Globals run is built on reps. But input delay, dropped frames and endgame stutter cost fights no amount of practice wins back. That part we fix.",
  pillars: [
    {
      icon: "aim",
      title: "Input delay",
      body: "BIOS, Windows and network, each tuned so nothing sits between your edit and the server.",
    },
    {
      icon: "frames",
      title: "The frame floor",
      body: "Your worst frame decides the fight when a third team lands. We raise the floor, not just the average.",
    },
    {
      icon: "endgame",
      title: "Endgame stability",
      body: "Moving zones, full builds, every team in one circle. A stock install folds there. A tuned one holds.",
    },
  ] as { icon: "aim" | "frames" | "endgame"; title: string; body: string }[],

  followTitle: "Follow One Prodige",
  followBody: "Their news, lives and best plays, on the official channels.",
  socials: [
    { platform: "x", name: "X", handle: "@oneprodige", href: "https://x.com/oneprodige" },
    {
      platform: "instagram",
      name: "Instagram",
      handle: "@1p_esport",
      href: "https://www.instagram.com/1p_esport/",
    },
    { platform: "twitch", name: "Twitch", handle: "1p_esport", href: "https://www.twitch.tv/1p_esport" },
    { platform: "tiktok", name: "TikTok", handle: "@oneprodige", href: "https://www.tiktok.com/@oneprodige" },
    { platform: "youtube", name: "YouTube", handle: "@1P_Esport", href: "https://www.youtube.com/@1P_Esport" },
    { platform: "discord", name: "Discord", handle: "Join the server", href: "https://discord.gg/qGnhNZmwNy" },
  ] as OnePSocial[],

  shop: {
    title: "The official jersey",
    body: "Gold and black, as the team wears it. Sold on their Kapoli club shop.",
    href: "https://www.kapoli.fr/boutiquedesclubs/ONE-PRODIGE-c196187501",
  },

  closeTitle: "Performance starts at your desk.",
  closeBody: "Your 5% is waiting in checkout. After you pay, a ticket on Discord books your session.",
};
