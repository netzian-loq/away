import type { LucideIcon } from "lucide-react";
import { MonitorCog, Sparkles, MemoryStick, Cpu, Wifi, Settings2 } from "lucide-react";

export interface ServiceImage {
  src: string;
  alt: string;
  caption: string;
}

export interface Service {
  slug: string;
  title: string;
  priceLabel: string;
  priceValue: number;
  icon: LucideIcon;
  summary: string;
  description: string;
  features: string[];
  images?: ServiceImage[];
  highlight?: string;
}

export const SERVICES: Service[] = [
  {
    slug: "windows-tuning",
    title: "Windows Tuning",
    priceLabel: "25€",
    priceValue: 25,
    icon: MonitorCog,
    summary:
      "Custom Gaming OS and complete Windows tuning — bloat stripped, kernel and dxgkrnl configured, scheduler and services tuned for an unreal gaming experience.",
    description:
      "Our flagship service. We deliver a Custom Gaming OS (AwayOS) and a deep Windows tune in one — configuring dxgkrnl, the kernel and registry, stripping unnecessary scheduled tasks, services, devices and drivers. Ships with the AwayOS Setup tuning app pre-installed so you control drivers, wallpapers, game fixes and system tools from one clean interface.",
    features: [
      "Custom Gaming OS (AwayOS) install option",
      "Bloat, telemetry and ad removal",
      "dxgkrnl + kernel registry tuning",
      "Scheduler, services and visual-effects trim",
      "Driver configuration",
      "Devices configuration",
      "Peripherals registry configuration",
      "Game configuration",
      "Unreal performance achievement",
      "AwayOS Setup tuning app built in",
      "Custom AwayOS wallpapers + dark UI theme",
    ],
    highlight:
      "Combines our Custom Gaming OS and Windows Tweaks into one package — same flat price. Includes the AwayOS Setup app for drivers, tweaks, game fixes and wallpapers.",
    images: [
      { src: "/awayos-desktop.svg", alt: "AwayOS desktop", caption: "AwayOS desktop — clean, dark, distraction-free" },
      { src: "/awayos-setup.svg", alt: "AwayOS Setup app", caption: "Built-in AwayOS Setup tuning app" },
    ],
  },
  {
    slug: "gpu-overclocking",
    title: "GPU Overclocking",
    priceLabel: "15€",
    priceValue: 15,
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
    slug: "ram-overclocking",
    title: "RAM Overclocking",
    priceLabel: "45€",
    priceValue: 45,
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
    priceLabel: "25€",
    priceValue: 25,
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
    slug: "network-tuning",
    title: "Network Tuning",
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
  {
    slug: "bios-tuning",
    title: "BIOS Tuning",
    priceLabel: "12€",
    priceValue: 12,
    icon: Settings2,
    summary:
      "Tuning all BIOS settings — hidden and visible — for extra-low latency, a smooth system, and a 100–300 FPS boost in most cases.",
    description:
      "Your BIOS is where real performance starts. We tune your specific board — ASUS, MSI, Gigabyte, ASRock — enabling the features that matter and disabling the ones that cost latency.",
    features: [
      "Hidden + visible setting audit",
      "Resizable BAR / Above 4G",
      "XMP / EXPO memory profiles",
      "C-states + power management",
      "PCIe lane + chipset tuning",
      "Secure boot + TPM kept compatible",
    ],
  },
];
