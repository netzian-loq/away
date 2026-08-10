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
  // Lowercase deliberately. Resend's pre-domain-verification check ("you can
  // only send to your own address") compares the recipient byte-for-byte
  // against the account address, so a capitalised local part is rejected even
  // though it's the same mailbox.
  email: "mattiaarminante77@gmail.com",
  discordServerUrl: "https://discord.gg/de5aXtGJ9a",
  discordVouchesUrl: "https://discord.gg/29Swpe8rM",
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
