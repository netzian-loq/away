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
  url: "https://awaytweaks.com",
  description:
    "Private, professional PC optimization for competitive gamers — custom gaming OS, CPU/GPU/RAM overclocking, BIOS, network and latency tuning for higher FPS and lower input delay.",
  email: "Mattiaarminante77@gmail.com",
  discordServerUrl: "https://discord.gg/saKde8DD9",
  discordVouchesUrl: "https://discord.gg/29Swpe8rM",
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
    { label: "Contact", href: "/contact" },
  ] as NavLink[],
};
