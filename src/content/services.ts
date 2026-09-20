import type { LucideIcon } from "lucide-react";
import {
  MonitorCog,
  Sparkles,
  MemoryStick,
  Cpu,
  Wifi,
  Settings2,
  Zap,
  HardDrive,
  Rocket,
} from "lucide-react";

export interface ServiceImage {
  src: string;
  alt: string;
  caption: string;
}

/**
 * The two halves of the service list. They are sold and chosen differently —
 * overclocking is hardware work on the machine you own, Windows work is the
 * software stack on top of it — and people arrive knowing which half they
 * want long before they know which item.
 */
export type ServiceCategory = "overclocking" | "windows";

export interface Service {
  slug: string;
  title: string;
  category: ServiceCategory;
  priceLabel: string;
  priceValue: number;
  icon: LucideIcon;
  /**
   * Short badge beside the title, e.g. "XOC" for extreme overclocking. Kept
   * separate from the title so the descriptive name still carries the page
   * copy and the search result, while the shorthand the owner actually uses
   * is visible on the card.
   */
  tag?: string;
  summary: string;
  description: string;
  features: string[];
  images?: ServiceImage[];
  highlight?: string;
}

export const SERVICE_CATEGORIES: { id: ServiceCategory; label: string; note: string }[] = [
  {
    id: "overclocking",
    label: "Overclocking",
    note: "Hardware pushed properly — CPU, GPU, RAM and the BIOS underneath them.",
  },
  {
    id: "windows",
    label: "Windows & network",
    note: "The software half: a clean, fast system and a connection that keeps up.",
  },
];

export const SERVICES: Service[] = [
  {
    slug: "ram-overclocking",
    title: "RAM Overclocking",
    category: "overclocking",
    tag: "XOC",
    priceLabel: "50€",
    priceValue: 50,
    icon: MemoryStick,
    summary:
      "Tight timings and a stable high-frequency memory profile — fixing crashes and unlocking real FPS gains without sacrificing stability.",
    description:
      "Memory tuning is where hidden FPS lives. We find a stable profile for your exact kit — Samsung B-die, D-die, Hynix or Micron — tightening primary, secondary and tertiary timings, tuning frequency and voltages, then validating for hours so you get lower latency and higher, more consistent frame rates with zero crashes.",
    features: [
      "Primary + sub-timing tuning",
      "Frequency and voltage tuning",
      "Die-specific profile (B-die, D-die, Hynix…)",
      "Crash and stability validation",
      "Latency + bandwidth benchmarking",
      "Safe rollback profile saved",
    ],
  },
  {
    slug: "cpu-overclocking",
    title: "CPU Overclocking",
    category: "overclocking",
    tag: "XOC",
    priceLabel: "27€",
    priceValue: 27,
    icon: Cpu,
    summary:
      "Unlock a completely different experience with ultra-low latency and maximum stability through an aggressive and safe overclock.",
    description:
      "No risk with professionals — just pure performance intake. Aggressive yet safe per-core curves, PBO and Curve Optimizer (AMD) or voltage / frequency scaling (Intel) tuned to your specific silicon for ultra-low latency and maximum stability.",
    features: [
      "Per-core curve / ratio tuning",
      "PBO + Curve Optimizer (AMD)",
      "Voltage and LLC tuning (Intel)",
      "Thermal headroom mapping",
      "Stress + real-game validation",
      "Safe rollback profile saved",
    ],
  },
  {
    slug: "gpu-overclocking",
    title: "GPU Overclocking",
    category: "overclocking",
    tag: "XOC",
    priceLabel: "18€",
    priceValue: 18,
    icon: Sparkles,
    summary:
      "Get the most out of the most expensive product in your PC — max responsiveness and visual smoothness with higher FPS overall.",
    description:
      "Unlock what you really paid for with professional GPU overclocking. Max responsiveness and visual smoothness with higher FPS overall — core and memory offsets, power limits, and fan curves dialed for sustained boost under real game loads.",
    features: [
      "Core and memory offset tuning",
      "Power and voltage limit tuning",
      "Fan / thermal curve tuning",
      "Sustained-boost validation",
      "Game-load validation",
      "Safe rollback profile saved",
    ],
  },
  {
    slug: "bios-tuning",
    title: "BIOS Full Tuning",
    category: "overclocking",
    priceLabel: "15€",
    priceValue: 15,
    icon: Settings2,
    summary:
      "Tuning all BIOS settings — hidden and visible — for extra-low latency, a smooth system, and a 100–300 FPS boost in most cases.",
    description:
      "Your BIOS is where real performance starts. We tune your specific board — ASUS, MSI, Gigabyte, ASRock — enabling the features that matter and disabling the ones that cost latency, including the hidden menus your board never shows you.",
    features: [
      "Hidden + visible setting audit",
      "Resizable BAR / Above 4G",
      "XMP / EXPO memory profiles",
      "C-states + power management",
      "PCIe lane + chipset tuning",
      "Secure boot + TPM kept compatible",
    ],
  },
  {
    slug: "away-os-windows-tuning",
    title: "AwayOS + Windows Tuning",
    category: "windows",
    priceLabel: "27€",
    priceValue: 27,
    icon: HardDrive,
    summary:
      "A clean install of our own custom gaming OS, tuned on arrival — the fastest way to a system with nothing in the way.",
    description:
      "We install AwayOS, our custom gaming build of Windows, and run the full Windows tune on top of it. Nothing carried over, nothing left behind: no bloat, no telemetry, no vendor services you never asked for. Ships with Away Utility pre-installed so you control drivers, wallpapers, game fixes and system tools from one clean interface.",
    features: [
      "AwayOS custom gaming OS installed",
      "Full Windows tune applied on top",
      "Bloat, telemetry and ad removal",
      "Driver + peripheral configuration",
      "Away Utility built in",
      "Custom AwayOS wallpapers + dark UI theme",
    ],
    highlight:
      "Our most popular single service — a fresh system and a full tune for 2€ more than the tune alone.",
  },
  {
    slug: "away-os-extreme-windows-tuning",
    title: "AwayOS + Extreme Windows Tuning",
    category: "windows",
    priceLabel: "32€",
    priceValue: 32,
    icon: Rocket,
    summary:
      "The custom OS with the extreme tune on top — everything stripped, everything tuned, nothing between you and the frames.",
    description:
      "AwayOS installed clean, then taken as far as it goes: the extreme tune digs into the kernel, the scheduler, dxgkrnl and the driver stack, strips services and scheduled tasks the standard tune leaves alone, and configures the system per game rather than in general.",
    features: [
      "Everything in AwayOS + Windows Tuning",
      "Kernel, scheduler and dxgkrnl tuning",
      "Aggressive service + task strip",
      "Per-game configuration",
      "Latency (ISR/DPC) reduction pass",
      "Before / after frametime capture",
    ],
  },
  {
    slug: "windows-tuning",
    title: "Windows Tuning",
    category: "windows",
    priceLabel: "25€",
    priceValue: 25,
    icon: MonitorCog,
    summary:
      "A complete tune of the Windows you already run — bloat stripped, registry and services configured, no reinstall needed.",
    description:
      "Keep your install, your files and your games exactly where they are. We strip bloat, telemetry and ads, configure the registry, services and scheduled tasks, tune drivers and peripherals, and leave you with a system that feels like different hardware.",
    features: [
      "No reinstall — your files stay put",
      "Bloat, telemetry and ad removal",
      "Registry + services configuration",
      "Scheduled task and device trim",
      "Driver configuration",
      "Peripherals registry configuration",
    ],
  },
  {
    slug: "extreme-windows-tuning",
    title: "Extreme Windows Tuning",
    category: "windows",
    priceLabel: "30€",
    priceValue: 30,
    icon: Zap,
    summary:
      "The tune taken to the limit on your existing install — kernel, scheduler and dxgkrnl, configured per game.",
    description:
      "Everything in the standard tune, then the layer underneath it: kernel and dxgkrnl registry tuning, scheduler behaviour, an aggressive pass on services and scheduled tasks, and configuration done per game rather than in general. For people who already know what a tuned system feels like and want the rest of it.",
    features: [
      "Everything in Windows Tuning",
      "Kernel, scheduler and dxgkrnl tuning",
      "Aggressive service + task strip",
      "Per-game configuration",
      "Latency (ISR/DPC) reduction pass",
      "Before / after frametime capture",
    ],
  },
  {
    slug: "network-tuning",
    title: "Network Optimization",
    category: "windows",
    priceLabel: "10€",
    priceValue: 10,
    icon: Wifi,
    summary:
      "Tune your network adapter for the lowest jitter and latency, lower CPU overhead, and the lowest ISR/DPC latency available.",
    description:
      "Latency is everything in competitive play. We tune the Windows network stack, NIC driver settings, QoS, DNS and routing so packets reach the server faster and more consistently.",
    features: [
      "NIC driver + adapter tuning",
      "TCP/IP stack tuning",
      "QoS policies for your games",
      "Low-latency DNS configuration",
      "ISR/DPC latency reduction",
      "Wi-Fi vs ethernet review",
    ],
  },
];

/** Services in one category, in the order they are sold. */
export function servicesIn(category: ServiceCategory): Service[] {
  return SERVICES.filter((service) => service.category === category);
}
