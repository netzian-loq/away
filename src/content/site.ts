export interface SiteStat {
  value: number;
  suffix: string;
  label: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export const SITE = {
  name: "Away Tweaks",
  url: "https://www.awaytweaks.com",
  description:
    "PC optimization for competitive gamers: Windows and BIOS tuning, CPU/GPU/RAM overclocking and network tuning for more FPS and lower input delay.",
  // Lowercase deliberately. Resend's pre-domain-verification check ("you can
  // only send to your own address") compares the recipient byte-for-byte
  // against the account address, so a capitalised local part is rejected even
  // though it's the same mailbox.
  email: "mattiaarminante77@gmail.com",
  discordServerUrl: "https://discord.gg/de5aXtGJ9a",
  /** The dedicated vouches invite (29Swpe8rM) expired, Discord answers
   *  "Unknown Invite" for it, so this points at the main server until the
   *  owner supplies a new permanent one. */
  discordVouchesUrl: "https://discord.gg/de5aXtGJ9a",
  /** Where buyers open a ticket after paying — linked from the receipt email. */
  discordSupportUrl: "https://discord.gg/md6hAnSrBE",
  /**
   * PayPal.Me handle, used as the manual fallback on /checkout until the
   * PayPal API credentials are set (see .env.local.example).
   */
  paypalMeHandle: "CarmelaBazzi",
  /**
   * Bank transfer details shown on /checkout.
   *
   * `accountHolder` MUST match the name on the account exactly — most banking
   * apps (and SEPA's Verification of Payee check) compare it against the IBAN
   * and warn or reject the transfer on a mismatch. Assumed from the PayPal
   * handle; correct it here if the account is in a different name.
   */
  bank: {
    accountHolder: "Carmela Bazzi",
    iban: "IT52G3608105138219694619732",
  },
  stats: [
    { value: 140, suffix: "+", label: "Rigs tuned" },
    { value: 99, suffix: "%", label: "Client retention" },
    { value: 24, suffix: "/7", label: "Support" },
    { value: 5, suffix: "★", label: "Average rating" },
  ] as SiteStat[],
  nav: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Uefi-Kompile", href: "/uefi-kompile" },
    { label: "OverTuner", href: "/overtuner" },
    { label: "About", href: "/about" },
    { label: "Free Tool", href: "/#utility" },
  ] as NavLink[],
};

/**
 * The home page's full title. Also the layout default, so a page without its
 * own title still gets one. Written out in full rather than through the
 * `%s | Away Tweaks` template because the brand already closes it.
 */
export const HOME_TITLE = `Gaming PC Optimization Service: FPS & Input Delay | ${SITE.name}`;

/**
 * Open Graph fields every page shares. Next merges metadata shallowly, so a
 * page that sets its own `openGraph` replaces the root layout's whole object
 * and would drop the site name, locale and image. Pages spread this first.
 */
export const OG_BASE = {
  type: "website" as const,
  siteName: SITE.name,
  locale: "en_US",
  images: [
    {
      url: "/opengraph-image.png",
      width: 1200,
      height: 630,
      alt: "Away Tweaks: PC optimization for competitive gamers",
    },
  ],
};
