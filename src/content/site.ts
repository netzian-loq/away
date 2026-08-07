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
    "Private, professional PC optimization for competitive gamers — custom gaming OS, CPU/GPU/RAM overclocking, BIOS, network and latency tuning for higher FPS and lower input delay.",
  email: "Mattiaarminante77@gmail.com",
  discordServerUrl: "https://discord.gg/saKde8DD9",
  discordVouchesUrl: "https://discord.gg/29Swpe8rM",
  /**
   * Where buyers open a ticket after paying — linked from the receipt email.
   * PLACEHOLDER: not yet confirmed with the site owner, do not ship as-is.
   */
  discordSupportUrl: "PLACEHOLDER_CONFIRM_DISCORD_SUPPORT_URL",
  /**
   * PayPal.Me handle, used as the manual fallback on /checkout until the
   * PayPal API credentials are set (see .env.local.example).
   * PLACEHOLDER: not yet confirmed with the site owner, do not ship as-is.
   */
  paypalMeHandle: "PLACEHOLDER_CONFIRM_PAYPAL_HANDLE",
  /**
   * Bank transfer details shown on /checkout.
   *
   * `accountHolder` MUST match the name on the account exactly — most banking
   * apps (and SEPA's Verification of Payee check) compare it against the IBAN
   * and warn or reject the transfer on a mismatch.
   * PLACEHOLDER: not yet confirmed with the site owner, do not ship as-is.
   */
  bank: {
    accountHolder: "PLACEHOLDER_CONFIRM_ACCOUNT_HOLDER",
    iban: "PLACEHOLDER_CONFIRM_IBAN",
  },
  stats: [
    { value: 40, suffix: "+", label: "Rigs tuned" },
    { value: 99, suffix: "%", label: "Client retention" },
    { value: 24, suffix: "/7", label: "Support" },
    { value: 5, suffix: "★", label: "Average rating" },
  ] as SiteStat[],
  nav: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
    { label: "Free Tool", href: "/#utility" },
    { label: "Contact", href: "/contact" },
  ] as NavLink[],
};
