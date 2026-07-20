# Away Tweaks Next.js Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Away Tweaks marketing site as a 4-page Next.js (App Router) application with Tailwind CSS v4, Framer Motion, and a single scoped GSAP effect, preserving all pricing/services/contact info while improving design, performance, mobile responsiveness, SEO and conversion.

**Architecture:** Content (services, pricing, business info, about copy) lives in typed data modules under `src/content/`, consumed by presentational section components under `src/components/sections/`, composed into 4 route pages under `src/app/`. Framer Motion handles all standard reveal/hover animation; GSAP + ScrollTrigger is dynamically imported and scoped to exactly one component (the AwayOS video showcase). The contact form posts to a Next.js Server Action that sends email via Resend.

**Tech Stack:** Next.js (latest, App Router) · TypeScript · React 19 · Tailwind CSS v4 · Framer Motion · GSAP + ScrollTrigger (video section only) · Zod · Resend · Vitest + React Testing Library

Full design rationale: [`docs/superpowers/specs/2026-07-20-away-tweaks-rebuild-design.md`](../specs/2026-07-20-away-tweaks-rebuild-design.md)

## Global Constraints

- Preserve all 6 services and their exact prices (Windows Tuning 25€, GPU Overclocking 15€, RAM Overclocking 45€, CPU Overclocking 25€, Network Tuning 10€, BIOS Tuning 12€). No content/price changes without asking first.
- Preserve all 5 pricing bundles and their exact prices/inclusions (Standard 35€, Entry Level 45€, High Entry Level 52€, Pro Level 65€ [featured], Extreme Level 90€). No changes without asking first.
- Preserve all contact info exactly: email `Mattiaarminante77@gmail.com`, Discord server `https://discord.gg/saKde8DD9`, Discord vouches `https://discord.gg/29Swpe8rM`.
- Exactly 4 pages: Home (`/`), Services (`/services`), About (`/about`), Contact (`/contact`).
- Full pricing bundle grid must appear on **both** Home and Services pages.
- Hero must NOT use a large scroll-jacking pinned timeline — normal scroll only.
- GSAP + ScrollTrigger is used in exactly one place (AwayOS video showcase), dynamically imported.
- Deployment target: Vercel. Package manager: npm.

---

## File Structure

```
away/
├── public/
│   ├── logo.svg                    # placeholder brand mark (swap for real asset later)
│   ├── awayos-desktop.svg          # placeholder screenshot (swap for real asset later)
│   ├── awayos-setup.svg            # placeholder screenshot (swap for real asset later)
│   └── llms.txt
├── vitest.config.ts
├── vitest.setup.ts
└── src/
    ├── app/
    │   ├── layout.tsx              # fonts, metadata base, Nav/DiscordBanner/Footer shell
    │   ├── globals.css             # Tailwind v4 theme tokens + utilities
    │   ├── page.tsx                # Home
    │   ├── sitemap.ts
    │   ├── robots.ts
    │   ├── services/page.tsx
    │   ├── about/page.tsx
    │   └── contact/page.tsx
    ├── content/
    │   ├── services.ts
    │   ├── pricing.ts
    │   ├── site.ts
    │   ├── why.ts
    │   └── about.ts
    ├── components/
    │   ├── ui/
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   └── textarea.tsx
    │   ├── motion/
    │   │   ├── reveal.tsx
    │   │   └── counter.tsx
    │   ├── layout/
    │   │   ├── nav.tsx
    │   │   ├── discord-banner.tsx
    │   │   └── footer.tsx
    │   ├── sections/
    │   │   ├── hero.tsx
    │   │   ├── trust-marquee.tsx
    │   │   ├── manifesto.tsx
    │   │   ├── video-showcase.tsx
    │   │   ├── services-teaser.tsx
    │   │   ├── services-full.tsx
    │   │   ├── why-us.tsx
    │   │   ├── pricing-table.tsx
    │   │   ├── vouches-cta.tsx
    │   │   ├── final-cta.tsx
    │   │   └── contact-form.tsx
    │   └── seo/
    │       └── json-ld.tsx
    ├── lib/
    │   ├── utils.ts                # cn()
    │   ├── validations.ts          # contact form zod schema
    │   └── email.ts                # Resend wrapper
    └── actions/
        └── contact.ts              # 'use server' form handler
```

Every `*.tsx`/`*.ts` file above (except `layout.tsx`, page files, and pure-config files) has a co-located `*.test.ts(x)` file created in the same task.

---

### Task 1: Scaffold project, install dependencies, wire up testing

**Files:**
- Create: entire Next.js scaffold via `create-next-app` (package.json, tsconfig.json, next.config.ts, eslint config, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` — all overwritten in later tasks)
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `public/logo.svg`
- Create: `public/awayos-desktop.svg`
- Create: `public/awayos-setup.svg`
- Modify: `package.json` (add `test`/`test:watch` scripts)

**Interfaces:**
- Produces: a working `npm run dev` / `npm run build` / `npm test` pipeline that every later task builds on.

- [ ] **Step 1: Scaffold the Next.js app in place**

Run from `C:\websites\away` (repo already has `.git` + `.gitattributes`, nothing else):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Accept defaults for any remaining prompts. This repo already has git history, so `--no-git` prevents `create-next-app` from trying to re-init it.

- [ ] **Step 2: Verify the scaffold builds and runs**

Run: `npm run build`
Expected: build completes with no errors, ending in a route summary (e.g. `○ /`).

Run: `npm run dev` (then stop it once confirmed)
Expected: server starts on `http://localhost:3000` with no errors in the terminal.

- [ ] **Step 3: Install production dependencies**

```bash
npm install framer-motion gsap resend zod clsx tailwind-merge lucide-react class-variance-authority
```

- [ ] **Step 4: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 5: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import React from "react";

// Nearly every component/page test below renders `next/link` and queries the
// resulting <a> via getByRole("link", ...). Rendering the real next/link
// outside an actual Next.js app router context is version-sensitive and a
// common source of flaky tests, so it's mocked once, globally, as a plain
// anchor — these are unit tests of our own components, not of next/link.
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string | { pathname?: string };
  }) =>
    React.createElement(
      "a",
      { href: typeof href === "string" ? href : (href?.pathname ?? "#"), ...props },
      children,
    ),
}));

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  constructor(_callback: IntersectionObserverCallback) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

// jsdom doesn't implement IntersectionObserver — several components use it.
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// jsdom doesn't implement matchMedia either — video-showcase.tsx checks
// prefers-reduced-motion before starting its GSAP effect. Default to
// "not matched" (i.e. motion allowed) so tests exercise the normal path.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

Add to `package.json` `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Add placeholder public assets**

Create `public/logo.svg`:

```xml
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0a0414" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="letter" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#c084fc" />
      <stop offset="100%" stop-color="#7c3aed" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="#08050f" />
  <circle cx="100" cy="100" r="90" fill="url(#glow)" />
  <path d="M100 46 L146 154 H126 L116 130 H84 L74 154 H54 Z M100 78 L88 112 H112 Z" fill="url(#letter)" />
</svg>
```

Create `public/awayos-desktop.svg`:

```xml
<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <rect width="1280" height="800" fill="#0b0713" />
  <rect x="24" y="24" width="1232" height="752" rx="24" fill="none" stroke="#3f2a63" stroke-width="2" />
  <text x="640" y="400" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#8b6bd1">
    AwayOS desktop — placeholder, replace with real screenshot
  </text>
</svg>
```

Create `public/awayos-setup.svg`:

```xml
<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <rect width="1280" height="800" fill="#0b0713" />
  <rect x="24" y="24" width="1232" height="752" rx="24" fill="none" stroke="#3f2a63" stroke-width="2" />
  <text x="640" y="400" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#8b6bd1">
    AwayOS Setup app — placeholder, replace with real screenshot
  </text>
</svg>
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js app with Tailwind v4, Vitest, and placeholder assets"
```

---

### Task 2: UI primitives — Button, Input, Textarea

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/button.test.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/textarea.tsx`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `@/lib/utils`; `Button` + `buttonVariants` (variants: `primary` | `outline`, sizes: `default` | `lg`) from `@/components/ui/button`; `Input` from `@/components/ui/input`; `Textarea` from `@/components/ui/textarea`.

- [ ] **Step 1: Write `cn()` utility**

Create `src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Write the failing Button test**

Create `src/components/ui/button.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders its children as a button", () => {
    render(<Button>Get Optimized</Button>);
    expect(screen.getByRole("button", { name: "Get Optimized" })).toBeInTheDocument();
  });

  it("applies outline-variant styling", () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toHaveClass("border");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- button.test`
Expected: FAIL — `Cannot find module './button'`

- [ ] **Step 4: Implement Button**

Create `src/components/ui/button.tsx`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-electric to-[oklch(0.5_0.2_300)] text-background shadow-glow hover:-translate-y-0.5 hover:shadow-glow-lg",
        outline:
          "glass border border-white/15 text-foreground hover:border-electric/50 hover:bg-white/5",
      },
      size: {
        default: "h-11 px-6 text-sm",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- button.test`
Expected: PASS (2 tests)

- [ ] **Step 6: Implement Input and Textarea (no dedicated tests — thin wrappers exercised via ContactForm tests in Task 15)**

Create `src/components/ui/input.tsx`:

```tsx
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-electric/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/30",
        className,
      )}
      {...props}
    />
  );
}
```

Create `src/components/ui/textarea.tsx`:

```tsx
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-electric/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/30",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils.ts src/components/ui
git commit -m "Add Button/Input/Textarea UI primitives"
```

---

### Task 3: Content data modules

**Files:**
- Create: `src/content/services.ts`
- Create: `src/content/services.test.ts`
- Create: `src/content/pricing.ts`
- Create: `src/content/pricing.test.ts`
- Create: `src/content/site.ts`
- Create: `src/content/site.test.ts`
- Create: `src/content/why.ts`
- Create: `src/content/why.test.ts`
- Create: `src/content/about.ts`
- Create: `src/content/about.test.ts`

**Interfaces:**
- Consumes: nothing (pure data)
- Produces: `SERVICES: Service[]`, `Service`/`ServiceImage` types (`@/content/services`); `PRICING_TIERS: PricingTier[]`, `PricingTier` type (`@/content/pricing`); `SITE` object (`@/content/site`); `WHY_REASONS: WhyReason[]`, `WhyReason` type (`@/content/why`); `ABOUT` object, `MethodStep` type (`@/content/about`). All later tasks import from these.

- [ ] **Step 1: Write the failing services test**

Create `src/content/services.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SERVICES } from "./services";

describe("SERVICES", () => {
  it("has exactly 6 services with the preserved prices", () => {
    expect(SERVICES).toHaveLength(6);
    const prices = Object.fromEntries(SERVICES.map((s) => [s.title, s.priceLabel]));
    expect(prices).toEqual({
      "Windows Tuning": "25€",
      "GPU Overclocking": "15€",
      "RAM Overclocking": "45€",
      "CPU Overclocking": "25€",
      "Network Tuning": "10€",
      "BIOS Tuning": "12€",
    });
  });

  it("gives Windows Tuning its two product screenshots", () => {
    const windowsTuning = SERVICES.find((s) => s.title === "Windows Tuning");
    expect(windowsTuning?.images).toHaveLength(2);
  });

  it("every service has at least one feature bullet", () => {
    for (const service of SERVICES) {
      expect(service.features.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- content/services.test`
Expected: FAIL — `Cannot find module './services'`

- [ ] **Step 3: Implement services.ts**

Create `src/content/services.ts`:

```ts
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- content/services.test`
Expected: PASS (3 tests)

- [ ] **Step 5: Write the failing pricing test**

Create `src/content/pricing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PRICING_TIERS } from "./pricing";

describe("PRICING_TIERS", () => {
  it("has exactly 5 tiers with the preserved prices", () => {
    expect(PRICING_TIERS).toHaveLength(5);
    const prices = Object.fromEntries(PRICING_TIERS.map((t) => [t.name, t.price]));
    expect(prices).toEqual({
      Standard: 35,
      "Entry Level": 45,
      "High Entry Level": 52,
      "Pro Level": 65,
      "Extreme Level": 90,
    });
  });

  it("marks exactly Pro Level as featured", () => {
    const featured = PRICING_TIERS.filter((t) => t.featured).map((t) => t.name);
    expect(featured).toEqual(["Pro Level"]);
  });

  it("Extreme Level includes RAM Overclocking", () => {
    const extreme = PRICING_TIERS.find((t) => t.name === "Extreme Level");
    expect(extreme?.features).toContain("RAM Overclocking");
  });
});
```

- [ ] **Step 6: Run it to verify it fails, then implement pricing.ts**

Run: `npm test -- content/pricing.test` → FAIL (`Cannot find module './pricing'`)

Create `src/content/pricing.ts`:

```ts
export interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  featured?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Standard",
    price: 35,
    description: "Essential optimization package for noticeable performance gains.",
    features: ["Windows Tuning", "BIOS Tuning"],
  },
  {
    name: "Entry Level",
    price: 45,
    description: "Great starting point with GPU overclocking included.",
    features: ["Windows Tuning", "BIOS Tuning", "GPU Overclocking"],
  },
  {
    name: "High Entry Level",
    price: 52,
    description: "CPU-focused package for processor-intensive workloads.",
    features: ["Windows Tuning", "BIOS Tuning", "CPU Overclocking"],
  },
  {
    name: "Pro Level",
    price: 65,
    featured: true,
    description: "Complete CPU and GPU overclocking for serious gamers.",
    features: ["Windows Tuning", "BIOS Tuning", "CPU Overclocking", "GPU Overclocking"],
  },
  {
    name: "Extreme Level",
    price: 90,
    description: "Maximum performance with full CPU, GPU and RAM overclocking.",
    features: ["Windows Tuning", "BIOS Tuning", "CPU Overclocking", "GPU Overclocking", "RAM Overclocking"],
  },
];
```

Run: `npm test -- content/pricing.test` → PASS (3 tests)

- [ ] **Step 7: Write the failing site test, then implement site.ts**

Create `src/content/site.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SITE } from "./site";

describe("SITE", () => {
  it("preserves the exact contact information", () => {
    expect(SITE.email).toBe("Mattiaarminante77@gmail.com");
    expect(SITE.discordServerUrl).toBe("https://discord.gg/saKde8DD9");
    expect(SITE.discordVouchesUrl).toBe("https://discord.gg/29Swpe8rM");
  });

  it("has exactly 4 nav links matching the site's 4 pages", () => {
    expect(SITE.nav.map((n) => n.href)).toEqual(["/", "/services", "/about", "/contact"]);
  });

  it("has 4 hero stats", () => {
    expect(SITE.stats).toHaveLength(4);
  });
});
```

Run: `npm test -- content/site.test` → FAIL (`Cannot find module './site'`)

Create `src/content/site.ts`:

```ts
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
```

Run: `npm test -- content/site.test` → PASS (3 tests)

- [ ] **Step 8: Write the failing why test, then implement why.ts**

Create `src/content/why.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { WHY_REASONS } from "./why";

describe("WHY_REASONS", () => {
  it("has 7 reasons, each with a title and description", () => {
    expect(WHY_REASONS).toHaveLength(7);
    for (const reason of WHY_REASONS) {
      expect(reason.title.length).toBeGreaterThan(0);
      expect(reason.description.length).toBeGreaterThan(0);
    }
  });
});
```

Run: `npm test -- content/why.test` → FAIL

Create `src/content/why.ts`:

```ts
import type { LucideIcon } from "lucide-react";
import { Trophy, Shield, Layers, Cpu, Headphones, Rocket, Sparkles } from "lucide-react";

export interface WhyReason {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const WHY_REASONS: WhyReason[] = [
  { icon: Trophy, title: "Experienced Optimization", description: "Years of competitive PC tuning across every major esports title." },
  { icon: Shield, title: "Safe Tweaks", description: "Reversible changes, full backups, and a stability-first methodology." },
  { icon: Layers, title: "Custom Configurations", description: "No copy-paste presets — every config tailored to your hardware." },
  { icon: Cpu, title: "Competitive Focus", description: "Tuned for ranked play, tournaments and high-refresh-rate setups." },
  { icon: Headphones, title: "Reliable Support", description: "Post-service support and re-tuning whenever your hardware changes." },
  { icon: Rocket, title: "Maximum Efficiency", description: "Every watt, cycle and clock pushed toward in-game performance." },
  { icon: Sparkles, title: "Premium Process", description: "Diagnostics, tune, validate, document. Every step transparent." },
];
```

Run: `npm test -- content/why.test` → PASS

- [ ] **Step 9: Write the failing about test, then draft about.ts**

Create `src/content/about.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ABOUT } from "./about";

describe("ABOUT", () => {
  it("has hero, mission, and CTA copy", () => {
    expect(ABOUT.heroTitle.length).toBeGreaterThan(0);
    expect(ABOUT.heroBody.length).toBeGreaterThan(0);
    expect(ABOUT.missionBody.length).toBeGreaterThan(0);
    expect(ABOUT.ctaBody.length).toBeGreaterThan(0);
  });

  it("has exactly 4 method steps", () => {
    expect(ABOUT.methodSteps).toHaveLength(4);
  });
});
```

Run: `npm test -- content/about.test` → FAIL

Create `src/content/about.ts` (drafted copy per user approval — review before launch):

```ts
export interface MethodStep {
  title: string;
  body: string;
}

export const ABOUT = {
  eyebrow: "About Away Tweaks",
  heroTitle: "We tune PCs for a living — not as a side hustle.",
  heroBody:
    "Away Tweaks started the way most performance obsessions do: not being satisfied with " +
    "\"it runs fine.\" What began as tuning our own rigs for ranked play turned into doing it " +
    "for other competitive players, then into a private optimization service with its own " +
    "custom gaming OS. The goal has never changed — take a PC that's leaving performance on " +
    "the table and get every last frame and millisecond out of it, safely and reversibly.",
  missionTitle: "Our mission",
  missionBody:
    "Most PCs run at a fraction of what their hardware can do — buried under bloat, default " +
    "BIOS settings, and generic driver configs that were never tuned for gaming. We exist to " +
    "close that gap: full-stack tuning from the operating system down to the silicon, so your " +
    "hardware performs like you paid for it to.",
  methodSteps: [
    {
      title: "Diagnose",
      body: "Every engagement starts with a full audit of your current setup — OS, BIOS, drivers, thermals and network — so we know exactly where performance is being left on the table before we touch anything.",
    },
    {
      title: "Tune",
      body: "We apply custom configuration at every layer that matters: Windows and kernel tuning, BIOS settings, CPU/GPU/RAM overclocking profiles, and network stack tuning — built for your exact hardware, never a copy-paste preset.",
    },
    {
      title: "Validate",
      body: "Every change is stress-tested and benchmarked before and after, often over hours, to confirm real stability under sustained load — not just a clean boot.",
    },
    {
      title: "Support",
      body: "You keep a safe rollback profile and direct access to us on Discord for re-tuning whenever your hardware, games, or drivers change.",
    },
  ] as MethodStep[],
  ctaTitle: "Want the same tune?",
  ctaBody: "Tell us about your rig and what you play — we'll come back with a plan within 24 hours.",
};
```

Run: `npm test -- content/about.test` → PASS

- [ ] **Step 10: Run the full content test suite and commit**

Run: `npm test -- content`
Expected: all content tests PASS

```bash
git add src/content
git commit -m "Add content data modules for services, pricing, site info, why-us, and about"
```

---

### Task 4: Design tokens and minimal root layout

**Files:**
- Modify: `src/app/globals.css` (replace default create-next-app content)
- Modify: `src/app/layout.tsx` (replace default create-next-app content)

**Interfaces:**
- Consumes: `SITE` from `@/content/site` (Task 3)
- Produces: Tailwind utilities `glass`, `glass-strong`, `text-gradient`, `hover-lift`, `grid-bg`; CSS custom properties `--electric`, `--electric-glow`, `--cyan-accent`; a `RootLayout` that later tasks extend with Nav/DiscordBanner/Footer.

- [ ] **Step 1: Replace globals.css with the theme**

Replace the contents of `src/app/globals.css`:

```css
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-display: var(--font-display), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono), ui-monospace, monospace;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted-foreground: var(--muted-foreground);
  --color-electric: var(--electric);
  --color-electric-glow: var(--electric-glow);
  --color-cyan-accent: var(--cyan-accent);

  --shadow-glow: 0 0 40px -8px var(--electric-glow);
  --shadow-glow-lg: 0 0 80px -12px var(--electric-glow);
}

:root {
  --background: oklch(0.08 0.025 300);
  --foreground: oklch(0.97 0.012 300);
  --muted-foreground: oklch(0.72 0.06 300);
  --electric: oklch(0.62 0.25 300);
  --electric-glow: oklch(0.62 0.27 300 / 0.45);
  --cyan-accent: oklch(0.76 0.15 300);
}

body {
  overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}

::selection {
  background: var(--electric);
  color: var(--background);
}

@utility glass {
  background: linear-gradient(
    135deg,
    color-mix(in oklab, oklch(0.13 0.04 300) 86%, transparent),
    color-mix(in oklab, oklch(0.13 0.04 300) 64%, transparent)
  );
  backdrop-filter: blur(10px) saturate(125%);
  border: 1px solid color-mix(in oklab, white 8%, transparent);
}

@utility glass-strong {
  background: color-mix(in oklab, oklch(0.11 0.038 300) 93%, transparent);
  backdrop-filter: blur(12px) saturate(140%);
  border: 1px solid color-mix(in oklab, white 10%, transparent);
}

@utility text-gradient {
  background: linear-gradient(
    110deg,
    oklch(0.98 0.02 300) 0%,
    oklch(0.84 0.15 305) 40%,
    oklch(0.66 0.25 300) 100%
  );
  background-clip: text;
  color: transparent;
}

@utility hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  &:hover {
    transform: translateY(-4px);
    border-color: color-mix(in oklab, var(--electric) 40%, transparent);
    box-shadow: 0 20px 50px -20px var(--electric-glow);
  }
}

@utility grid-bg {
  background-image:
    linear-gradient(color-mix(in oklab, var(--electric) 7%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in oklab, var(--electric) 7%, transparent) 1px, transparent 1px);
  background-size: 56px 56px;
}

@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Replace layout.tsx with a minimal shell (fonts + metadata only — Nav/Footer added in Task 6)**

This also adds the pre-paint "perf-lite" detection the video showcase (Task 9) checks for: a synchronous inline script, run before first paint, that flags `prefers-reduced-motion` or software-rendered WebGL (SwiftShader/llvmpipe — common on VMs, remote desktops, and old integrated GPUs) by adding a `perf-lite` class to `<html>`. Without this step the check in `video-showcase.tsx` would never trigger, since nothing else sets that class.

Replace the contents of `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { SITE } from "@/content/site";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Elite PC Optimization for Competitive Gamers`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  authors: [{ name: SITE.name }],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

// Runs before first paint: flags reduced-motion preference or software
// rendering (no real GPU) so the video showcase's GSAP pin-and-scale effect
// (Task 9) can skip itself instead of janking on a machine that can't
// afford it.
const PERF_LITE_INIT = `(function(){try{var r=document.documentElement;if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){r.classList.add('perf-lite');return;}var c=document.createElement('canvas');var gl=c.getContext('webgl')||c.getContext('experimental-webgl');if(!gl){r.classList.add('perf-lite');return;}var e=gl.getExtension('WEBGL_debug_renderer_info');var n=e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'';if(/swiftshader|llvmpipe|software|microsoft basic render/i.test(String(n))){r.classList.add('perf-lite');}}catch(_){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background pt-10 text-foreground antialiased sm:pt-11">
        <script dangerouslySetInnerHTML={{ __html: PERF_LITE_INIT }} />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the build still succeeds**

Run: `npm run build`
Expected: build completes with no errors (the default homepage content from `create-next-app` will look unstyled/broken until later tasks replace `page.tsx` — that's expected here, not a regression).

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "Add neon-dark design tokens and minimal root layout"
```

---

### Task 5: Motion primitives — Reveal, Counter

**Files:**
- Create: `src/components/motion/reveal.tsx`
- Create: `src/components/motion/reveal.test.tsx`
- Create: `src/components/motion/counter.tsx`
- Create: `src/components/motion/counter.test.tsx`

**Interfaces:**
- Produces: `Reveal({ children, delay?, className?, y? })` (`@/components/motion/reveal`); `Counter({ to, suffix?, duration? })` (`@/components/motion/counter`).

- [ ] **Step 1: Write the failing Reveal test**

Create `src/components/motion/reveal.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Reveal } from "./reveal";

describe("Reveal", () => {
  it("renders its children", () => {
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>,
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- motion/reveal.test`
Expected: FAIL — `Cannot find module './reveal'`

- [ ] **Step 3: Implement Reveal**

Create `src/components/motion/reveal.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}

export function Reveal({ children, delay = 0, className, y = 16 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- motion/reveal.test`
Expected: PASS

- [ ] **Step 5: Write the failing Counter test**

Create `src/components/motion/counter.test.tsx`:

```tsx
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Counter } from "./counter";

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return { ...actual, useInView: () => true };
});

describe("Counter", () => {
  it("counts up to the target value and appends the suffix", async () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      now += 250;
      cb(now);
      return 0;
    });

    render(<Counter to={40} suffix="+" duration={0.2} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("40+")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm test -- motion/counter.test`
Expected: FAIL — `Cannot find module './counter'`

- [ ] **Step 7: Implement Counter**

Create `src/components/motion/counter.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface CounterProps {
  to: number;
  suffix?: string;
  duration?: number;
}

export function Counter({ to, suffix = "", duration = 1.8 }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(to * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npm test -- motion/counter.test`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/motion
git commit -m "Add Reveal and Counter motion primitives"
```

---

### Task 6: Layout shell — Nav, DiscordBanner, Footer

**Files:**
- Create: `src/components/layout/nav.tsx`
- Create: `src/components/layout/nav.test.tsx`
- Create: `src/components/layout/discord-banner.tsx`
- Create: `src/components/layout/footer.tsx`
- Create: `src/components/layout/footer.test.tsx`
- Modify: `src/app/layout.tsx` (render `<DiscordBanner />`, `<Nav />`, `<Footer />` around `children`)

**Interfaces:**
- Consumes: `SITE` (`@/content/site`), `SERVICES` (`@/content/services`), `Button` (`@/components/ui/button`)
- Produces: `Nav`, `DiscordBanner`, `Footer` components; updated `RootLayout` wiring them around `<main>{children}</main>`.

- [ ] **Step 1: Write the failing Nav test**

Create `src/components/layout/nav.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Nav } from "./nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/services",
}));

describe("Nav", () => {
  it("renders links to all 4 pages", () => {
    render(<Nav />);
    expect(screen.getAllByRole("link", { name: "Home" })[0]).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: "Services" })[0]).toHaveAttribute("href", "/services");
    expect(screen.getAllByRole("link", { name: "About" })[0]).toHaveAttribute("href", "/about");
    expect(screen.getAllByRole("link", { name: "Contact" })[0]).toHaveAttribute("href", "/contact");
  });

  it("renders a Get Optimized CTA linking to /contact", () => {
    render(<Nav />);
    const ctas = screen.getAllByRole("link", { name: /Get Optimized/i });
    expect(ctas[0]).toHaveAttribute("href", "/contact");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- layout/nav.test`
Expected: FAIL — `Cannot find module './nav'`

- [ ] **Step 3: Implement Nav**

Create `src/components/layout/nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/content/site";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("fixed inset-x-0 top-10 z-40 transition-all duration-500", scrolled ? "py-3" : "py-5")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 sm:px-5",
            scrolled ? "glass-strong shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]" : "bg-transparent",
          )}
        >
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl ring-1 ring-electric/40 shadow-glow">
              <img src="/logo.svg" alt="Away Tweaks logo" className="h-full w-full object-cover" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Away<span className="text-electric"> Tweaks</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {SITE.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:block">
            <Link href="/contact">
              <Button size="lg">
                Get Optimized <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <button
            className="glass grid h-10 w-10 place-items-center rounded-xl lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="glass-strong mt-2 rounded-2xl p-3 lg:hidden">
            {SITE.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm text-foreground/90 hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/contact" onClick={() => setOpen(false)}>
              <Button className="mt-2 w-full">Get Optimized</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- layout/nav.test`
Expected: PASS (2 tests)

- [ ] **Step 5: Implement DiscordBanner (no dedicated test — a static link, exercised visually)**

Create `src/components/layout/discord-banner.tsx`:

```tsx
import { Disc, ArrowRight } from "lucide-react";
import { SITE } from "@/content/site";

export function DiscordBanner() {
  return (
    <a
      href={SITE.discordServerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed inset-x-0 top-0 z-50 block border-b border-white/10 bg-gradient-to-r from-[#5865F2] via-[#7289DA] to-[#5865F2] bg-[length:200%_100%]"
    >
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-center gap-2 px-4 text-[12px] font-medium text-white sm:h-11 sm:gap-3 sm:px-6 sm:text-sm">
        <Disc className="h-4 w-4 shrink-0" />
        <span className="truncate">
          Join the <span className="font-bold">Away Tweaks</span> Discord — tweaks, support &amp; squad up
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-black/30 px-2.5 py-1 font-bold group-hover:bg-black/50">
          Join <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </a>
  );
}
```

- [ ] **Step 6: Write the failing Footer test**

Create `src/components/layout/footer.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./footer";
import { SERVICES } from "@/content/services";

describe("Footer", () => {
  it("lists every service", () => {
    render(<Footer />);
    for (const service of SERVICES) {
      expect(screen.getAllByText(service.title)[0]).toBeInTheDocument();
    }
  });

  it("shows the current year in the copyright line", () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run it to verify it fails, then implement Footer**

Run: `npm test -- layout/footer.test` → FAIL

Create `src/components/layout/footer.tsx`:

```tsx
import Link from "next/link";
import { Disc } from "lucide-react";
import { SITE } from "@/content/site";
import { SERVICES } from "@/content/services";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl ring-1 ring-electric/40">
                <img src="/logo.svg" alt="Away Tweaks logo" className="h-full w-full object-cover" />
              </span>
              <span className="font-display text-lg font-bold">
                Away<span className="text-electric"> Tweaks</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Elite PC optimization, custom gaming OS builds, and overclocking for competitive
              players who want their hardware to keep up with their skill.
            </p>
            <a
              href={SITE.discordServerUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Away Tweaks Discord"
              className="glass mt-5 grid h-9 w-9 place-items-center rounded-lg hover:border-electric/50 hover:text-electric"
            >
              <Disc className="h-4 w-4" />
            </a>
          </div>

          <div>
            <div className="font-display text-sm font-semibold">Quick Links</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {SITE.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-electric">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-display text-sm font-semibold">Services</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link href="/services" className="hover:text-electric">
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-muted-foreground sm:flex-row">
          <div>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-5">
            <Link href="/services" className="hover:text-electric">Services</Link>
            <Link href="/#pricing" className="hover:text-electric">Pricing</Link>
            <Link href="/contact" className="hover:text-electric">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

Run: `npm test -- layout/footer.test` → PASS (2 tests)

- [ ] **Step 8: Wire Nav/DiscordBanner/Footer into the root layout**

Modify `src/app/layout.tsx` — add the imports and render them around `children`:

```tsx
import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { SITE } from "@/content/site";
import { DiscordBanner } from "@/components/layout/discord-banner";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

// ...(font setup, metadata, and PERF_LITE_INIT unchanged from Task 4)...

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background pt-10 text-foreground antialiased sm:pt-11">
        <script dangerouslySetInnerHTML={{ __html: PERF_LITE_INIT }} />
        <DiscordBanner />
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 9: Verify the build still succeeds**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 10: Commit**

```bash
git add src/components/layout src/app/layout.tsx
git commit -m "Add Nav, DiscordBanner, and Footer; wire into root layout"
```

---

### Task 7: Validation, email, and contact server action

**Files:**
- Create: `src/lib/validations.ts`
- Create: `src/lib/validations.test.ts`
- Create: `src/lib/email.ts`
- Create: `src/actions/contact.ts`
- Create: `src/actions/contact.test.ts`
- Create: `.env.local.example`

**Interfaces:**
- Produces: `contactFormSchema`, `ContactFormValues` (`@/lib/validations`); `sendContactEmail(input: ContactEmailInput)`, `ContactEmailInput` (`@/lib/email`); `submitContactForm(prevState: ContactActionState, formData: FormData): Promise<ContactActionState>`, `ContactActionState` (`@/actions/contact`).

- [ ] **Step 1: Write the failing validation test**

Create `src/lib/validations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contactFormSchema } from "./validations";

describe("contactFormSchema", () => {
  it("accepts a fully valid submission", () => {
    const result = contactFormSchema.safeParse({
      name: "Logan",
      discord: "logan#0001",
      specs: "5800X3D / 4080 / 32GB",
      message: "Need my rig tuned for Valorant, current FPS feels low.",
      company: "",
      startedAt: String(Date.now()),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = contactFormSchema.safeParse({
      name: "",
      discord: "logan#0001",
      message: "Need my rig tuned for Valorant.",
      startedAt: String(Date.now()),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short message", () => {
    const result = contactFormSchema.safeParse({
      name: "Logan",
      discord: "logan#0001",
      message: "hi",
      startedAt: String(Date.now()),
    });
    expect(result.success).toBe(false);
  });

  it("allows specs to be omitted", () => {
    const result = contactFormSchema.safeParse({
      name: "Logan",
      discord: "logan#0001",
      message: "Need my rig tuned for Valorant, current FPS feels low.",
      startedAt: String(Date.now()),
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- lib/validations.test`
Expected: FAIL — `Cannot find module './validations'`

- [ ] **Step 3: Implement the schema**

Create `src/lib/validations.ts`:

```ts
import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  discord: z.string().trim().min(2, "Enter your Discord username").max(100),
  specs: z.string().trim().max(500).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a bit more about what you need").max(2000),
  company: z.string().optional().or(z.literal("")),
  startedAt: z.coerce.number(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- lib/validations.test`
Expected: PASS (4 tests)

- [ ] **Step 5: Implement the email wrapper (no dedicated test — exercised via the server action tests in Step 7)**

Create `src/lib/email.ts`:

```ts
import { Resend } from "resend";

export interface ContactEmailInput {
  name: string;
  discord: string;
  specs?: string;
  message: string;
}

export async function sendContactEmail(input: ContactEmailInput) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { name, discord, specs, message } = input;
  const result = await resend.emails.send({
    from: "Away Tweaks Website <onboarding@resend.dev>",
    to: "Mattiaarminante77@gmail.com",
    subject: `Away Tweaks Request — ${name}`,
    text: `Name: ${name}\nDiscord: ${discord}\nPC Specs: ${specs || "—"}\n\nMessage:\n${message}`,
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result;
}
```

Create `.env.local.example`:

```
RESEND_API_KEY=re_your_key_here
```

The scaffold's `.gitignore` (from Task 1) has a blanket `.env*` rule, which would also swallow this example file. Add a negation line right after the `.env*` line in `.gitignore` so the example stays tracked:

```
.env*
!.env.local.example
```

- [ ] **Step 6: Write the failing server action tests**

Create `src/actions/contact.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const { sendContactEmail } = vi.hoisted(() => ({ sendContactEmail: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendContactEmail }));

import { submitContactForm, type ContactActionState } from "./contact";

function toFormData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const initialState: ContactActionState = { status: "idle" };
const validFields = {
  name: "Logan",
  discord: "logan#0001",
  specs: "5800X3D / 4080",
  message: "Need my rig tuned for Valorant, current FPS feels low.",
  company: "",
  startedAt: String(Date.now() - 5000),
};

describe("submitContactForm", () => {
  beforeEach(() => {
    sendContactEmail.mockReset();
    sendContactEmail.mockResolvedValue({ data: { id: "1" }, error: null });
  });

  it("sends the email and returns success for a valid, human-timed submission", async () => {
    const result = await submitContactForm(initialState, toFormData(validFields));
    expect(sendContactEmail).toHaveBeenCalledWith({
      name: "Logan",
      discord: "logan#0001",
      specs: "5800X3D / 4080",
      message: validFields.message,
    });
    expect(result.status).toBe("success");
  });

  it("returns a validation error and never sends when required fields are missing", async () => {
    const result = await submitContactForm(initialState, toFormData({ ...validFields, name: "" }));
    expect(result.status).toBe("error");
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it("silently succeeds without sending when the honeypot field is filled", async () => {
    const result = await submitContactForm(
      initialState,
      toFormData({ ...validFields, company: "I am a bot" }),
    );
    expect(result.status).toBe("success");
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it("silently succeeds without sending when the form was submitted too fast", async () => {
    const result = await submitContactForm(
      initialState,
      toFormData({ ...validFields, startedAt: String(Date.now()) }),
    );
    expect(result.status).toBe("success");
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it("returns an error if sending the email fails", async () => {
    sendContactEmail.mockRejectedValue(new Error("network down"));
    const result = await submitContactForm(initialState, toFormData(validFields));
    expect(result.status).toBe("error");
  });
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `npm test -- actions/contact.test`
Expected: FAIL — `Cannot find module './contact'`

- [ ] **Step 8: Implement the server action**

Create `src/actions/contact.ts`:

```ts
"use server";

import { contactFormSchema } from "@/lib/validations";
import { sendContactEmail } from "@/lib/email";

export interface ContactActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const MIN_FILL_TIME_MS = 1500;

export async function submitContactForm(
  _prevState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = contactFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    };
  }

  const { name, discord, specs, message, company, startedAt } = parsed.data;

  if (company) {
    return { status: "success" };
  }

  if (Date.now() - startedAt < MIN_FILL_TIME_MS) {
    return { status: "success" };
  }

  try {
    await sendContactEmail({ name, discord, specs, message });
    return { status: "success" };
  } catch {
    return {
      status: "error",
      message: "Something went wrong sending your message.",
    };
  }
}
```

- [ ] **Step 9: Run it to verify it passes**

Run: `npm test -- actions/contact.test`
Expected: PASS (5 tests)

- [ ] **Step 10: Commit**

```bash
git add src/lib/validations.ts src/lib/validations.test.ts src/lib/email.ts src/actions .env.local.example
git commit -m "Add contact form validation, email sending, and server action"
```

---

### Task 8: Hero, TrustMarquee, Manifesto

**Files:**
- Create: `src/components/sections/hero.tsx`
- Create: `src/components/sections/hero.test.tsx`
- Create: `src/components/sections/trust-marquee.tsx`
- Create: `src/components/sections/manifesto.tsx`

**Interfaces:**
- Consumes: `SITE` (`@/content/site`), `Button` (`@/components/ui/button`), `Reveal`/`Counter` (`@/components/motion/*`)
- Produces: `Hero`, `TrustMarquee`, `Manifesto` components.

- [ ] **Step 1: Write the failing Hero test**

Create `src/components/sections/hero.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./hero";

describe("Hero", () => {
  it("renders the headline and both primary CTAs", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { name: "Away Tweaks." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Contact now/i })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: /View PRO tweaks/i })).toHaveAttribute("href", "/services");
  });

  it("renders every stat label from site content", () => {
    render(<Hero />);
    expect(screen.getByText("Rigs tuned")).toBeInTheDocument();
    expect(screen.getByText("Average rating")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- sections/hero.test`
Expected: FAIL — `Cannot find module './hero'`

- [ ] **Step 3: Implement Hero — no scroll-jacking, normal document flow**

Create `src/components/sections/hero.tsx`:

```tsx
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { Counter } from "@/components/motion/counter";
import { SITE } from "@/content/site";

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-32 pb-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.16_0.09_300)_0%,oklch(0.09_0.03_300)_60%,oklch(0.07_0.025_300)_100%)]" />
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="absolute -top-32 -left-20 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,var(--electric-glow)_0%,transparent_60%)] blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,oklch(0.5_0.2_300_/_0.3)_0%,transparent_60%)] blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <span className="inline-grid h-24 w-24 place-items-center overflow-hidden rounded-3xl ring-1 ring-electric/40 shadow-glow sm:h-32 sm:w-32">
              <img src="/logo.svg" alt="Away Tweaks" className="h-full w-full object-cover" />
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mt-8 font-display text-[clamp(2.5rem,8vw,6rem)] font-bold leading-[0.95] tracking-tight">
              <span className="text-gradient">Away Tweaks.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Professional PC optimization for maximum gaming performance. FPS boost, latency
              reduction, and system tweaks engineered for competitive play.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/contact">
                <Button size="lg">
                  Contact now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline">
                  View PRO tweaks
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-20 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6">
              {SITE.stats.map((stat) => (
                <div key={stat.label} className="glass rounded-2xl border border-white/5 p-4 text-center sm:p-5">
                  <div className="font-display text-2xl font-bold text-gradient sm:text-3xl">
                    <Counter to={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <a
        href="#services-teaser"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground/60 hover:text-electric"
        aria-label="Scroll to services"
      >
        <ChevronDown className="h-6 w-6 animate-bounce" />
      </a>
    </section>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- sections/hero.test`
Expected: PASS (2 tests)

- [ ] **Step 5: Implement TrustMarquee and Manifesto (no dedicated tests — static content, exercised via the Home page test in Task 12)**

Create `src/components/sections/trust-marquee.tsx`:

```tsx
const ITEMS = [
  "FPS BOOST",
  "LOW LATENCY",
  "CUSTOM GAMING OS",
  "BIOS TUNING",
  "CPU · GPU · RAM OVERCLOCK",
  "NETWORK TUNING",
  "STABILITY VALIDATED",
];

export function TrustMarquee() {
  const strip = ITEMS.map((item) => (
    <span key={item} className="mx-6 inline-flex items-center gap-6 whitespace-nowrap">
      <span>{item}</span>
      <span className="h-1.5 w-1.5 rounded-full bg-electric" />
    </span>
  ));

  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-white/[0.015] py-5">
      <div className="flex w-max items-center motion-reduce:animate-none" style={{ animation: "marquee 26s linear infinite" }}>
        <div className="flex items-center font-display text-sm font-semibold uppercase tracking-[0.3em] text-foreground/40 sm:text-base">
          {strip}
        </div>
        <div
          className="flex items-center font-display text-sm font-semibold uppercase tracking-[0.3em] text-foreground/40 sm:text-base"
          aria-hidden
        >
          {strip}
        </div>
      </div>
    </div>
  );
}
```

Create `src/components/sections/manifesto.tsx`:

```tsx
import { Reveal } from "@/components/motion/reveal";

export function Manifesto() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-electric">The Away method</span>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 font-display text-3xl font-bold leading-[1.15] tracking-tight sm:text-5xl">
            Your rig is capable of more. We strip Windows down to the metal, unlock the BIOS,
            overclock the CPU, GPU and RAM, and validate every change for hours — until the only
            limit left in your setup is you.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/hero.tsx src/components/sections/hero.test.tsx src/components/sections/trust-marquee.tsx src/components/sections/manifesto.tsx
git commit -m "Add Hero, TrustMarquee, and Manifesto sections"
```

---

### Task 9: AwayOS video showcase (the one GSAP-scoped section)

**Files:**
- Create: `src/components/sections/video-showcase.tsx`
- Create: `src/components/sections/video-showcase.test.tsx`

**Interfaces:**
- Consumes: `Reveal` (`@/components/motion/reveal`)
- Produces: `VideoShowcase` component. This is the **only** file in the codebase that imports `gsap`/`gsap/ScrollTrigger`, and it does so via dynamic `import()` inside a `useEffect`, not a top-level import.

- [ ] **Step 1: Write the failing test**

Create `src/components/sections/video-showcase.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("gsap", () => ({
  gsap: {
    registerPlugin: vi.fn(),
    fromTo: vi.fn(() => ({ scrollTrigger: { kill: vi.fn() }, kill: vi.fn() })),
  },
}));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {} }));

import { VideoShowcase } from "./video-showcase";

describe("VideoShowcase", () => {
  it("renders the AwayOS preview heading without loading real GSAP or YouTube", () => {
    render(<VideoShowcase />);
    expect(screen.getByRole("heading", { name: /AwayOS in action/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- sections/video-showcase.test`
Expected: FAIL — `Cannot find module './video-showcase'`

- [ ] **Step 3: Implement VideoShowcase**

Create `src/components/sections/video-showcase.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Reveal } from "@/components/motion/reveal";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const VIDEO_ID = "YdQl1PbTqRs";
const START = 50;
const END = 75;

function useAwayOsPlayer(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    let player: any = null;

    const loadApi = () =>
      new Promise<void>((resolve) => {
        if (window.YT?.Player) return resolve();
        const existing = document.querySelector<HTMLScriptElement>(
          'script[src="https://www.youtube.com/iframe_api"]',
        );
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prev?.();
          resolve();
        };
        if (!existing) {
          const script = document.createElement("script");
          script.src = "https://www.youtube.com/iframe_api";
          script.async = true;
          document.head.appendChild(script);
        }
      });

    const init = async () => {
      await loadApi();
      if (cancelled || !containerRef.current) return;
      player = new window.YT.Player(containerRef.current, {
        videoId: VIDEO_ID,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          start: START,
          end: END,
        },
        events: {
          onReady: (e: any) => {
            e.target.mute();
            e.target.seekTo(START, true);
            e.target.playVideo();
            interval = setInterval(() => {
              const t = e.target.getCurrentTime?.();
              const state = e.target.getPlayerState?.();
              if ((typeof t === "number" && t >= END - 0.15) || state === 0 || state === 5) {
                e.target.seekTo(START, true);
                e.target.playVideo();
              }
            }, 250);
          },
        },
      });
    };

    let observer: IntersectionObserver | null = null;
    const el = containerRef.current;
    if (el) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            observer?.disconnect();
            init();
          }
        },
        { rootMargin: "300px" },
      );
      observer.observe(el);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (interval) clearInterval(interval);
      player?.destroy?.();
    };
  }, [containerRef]);
}

function useVideoPinReveal(wrapRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.classList.contains("perf-lite")) return;

    let cancelled = false;
    let cleanup = () => {};

    import("gsap").then(async ({ gsap }) => {
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      // A single scrub tween — deliberately not the old site's multi-stage
      // pinned timeline, which was the main source of scroll jank.
      const tween = gsap.fromTo(
        wrap,
        { scale: 0.85, opacity: 0.4 },
        {
          scale: 1,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: wrap, start: "top 85%", end: "top 35%", scrub: 0.5 },
        },
      );
      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [wrapRef]);
}

export function VideoShowcase() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useAwayOsPlayer(containerRef);
  useVideoPinReveal(wrapRef);

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-electric/30 bg-electric/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-electric">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-electric" />
            AwayOS Preview
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            See <span className="text-gradient">AwayOS</span> in action
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            A 25-second look at the custom gaming OS — stripped, tuned, and built for frames.
          </p>
        </Reveal>

        <div ref={wrapRef} className="relative">
          <div className="relative overflow-hidden rounded-2xl border border-electric/20 bg-black shadow-2xl">
            <div className="relative aspect-video w-full">
              <div ref={containerRef} className="pointer-events-none absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 z-10 cursor-default" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- sections/video-showcase.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/video-showcase.tsx src/components/sections/video-showcase.test.tsx
git commit -m "Add AwayOS video showcase with scoped GSAP pin-and-scale reveal"
```

---

### Task 10: Services teaser and full services listing

**Files:**
- Create: `src/components/sections/services-teaser.tsx`
- Create: `src/components/sections/services-teaser.test.tsx`
- Create: `src/components/sections/services-full.tsx`
- Create: `src/components/sections/services-full.test.tsx`

**Interfaces:**
- Consumes: `SERVICES` (`@/content/services`), `Reveal` (`@/components/motion/reveal`)
- Produces: `ServicesTeaser` (condensed cards for Home), `ServicesFull` (complete detail for the Services page).

- [ ] **Step 1: Write the failing ServicesTeaser test**

Create `src/components/sections/services-teaser.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServicesTeaser } from "./services-teaser";
import { SERVICES } from "@/content/services";

describe("ServicesTeaser", () => {
  it("renders a card for every service with its price", () => {
    render(<ServicesTeaser />);
    for (const service of SERVICES) {
      expect(screen.getByText(service.title)).toBeInTheDocument();
      expect(screen.getByText(service.priceLabel)).toBeInTheDocument();
    }
  });

  it("links to the full services page", () => {
    render(<ServicesTeaser />);
    expect(screen.getByRole("link", { name: /See all services/i })).toHaveAttribute("href", "/services");
  });
});
```

- [ ] **Step 2: Run it to verify it fails, then implement ServicesTeaser**

Run: `npm test -- sections/services-teaser.test` → FAIL

Create `src/components/sections/services-teaser.tsx`:

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SERVICES } from "@/content/services";

export function ServicesTeaser() {
  return (
    <section id="services-teaser" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Services</span>
          <h2 className="mt-4 font-display text-3xl font-bold text-gradient sm:text-4xl">Every layer, tuned.</h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => {
            const Icon = service.icon;
            return (
              <Reveal key={service.slug} delay={i * 0.05}>
                <div className="hover-lift glass h-full rounded-2xl border border-white/5 p-6">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-electric/30 bg-electric/10">
                    <Icon className="h-5 w-5 text-electric" strokeWidth={2} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <h3 className="font-display font-semibold">{service.title}</h3>
                    <span className="font-mono text-sm font-semibold text-electric">{service.priceLabel}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.summary}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-electric hover:underline">
            See all services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
```

Run: `npm test -- sections/services-teaser.test` → PASS

- [ ] **Step 3: Write the failing ServicesFull test**

Create `src/components/sections/services-full.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServicesFull } from "./services-full";
import { SERVICES } from "@/content/services";

describe("ServicesFull", () => {
  it("renders full detail for every service, including every feature bullet", () => {
    render(<ServicesFull />);
    for (const service of SERVICES) {
      expect(screen.getByRole("heading", { name: service.title })).toBeInTheDocument();
      for (const feature of service.features) {
        expect(screen.getByText(feature)).toBeInTheDocument();
      }
    }
  });
});
```

- [ ] **Step 4: Run it to verify it fails, then implement ServicesFull**

Run: `npm test -- sections/services-full.test` → FAIL

Create `src/components/sections/services-full.tsx`:

```tsx
import { Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SERVICES } from "@/content/services";

export function ServicesFull() {
  return (
    <div className="space-y-10">
      {SERVICES.map((service, i) => {
        const Icon = service.icon;
        return (
          <Reveal key={service.slug} delay={i * 0.04}>
            <article className="glass rounded-3xl border border-white/5 p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-electric/40 bg-gradient-to-br from-electric/25 to-cyan-accent/10">
                  <Icon className="h-5 w-5 text-electric" strokeWidth={2} />
                </div>
                <h2 className="font-display text-2xl font-bold">{service.title}</h2>
                <span className="rounded-lg border border-electric/30 bg-electric/10 px-2.5 py-1 font-mono text-sm font-semibold text-electric">
                  {service.priceLabel}
                </span>
              </div>

              <p className="mt-5 max-w-3xl leading-relaxed text-foreground/85">{service.description}</p>

              {service.highlight && (
                <div className="mt-5 flex gap-3 rounded-xl border border-electric/40 bg-electric/10 p-4">
                  <p className="text-sm leading-relaxed text-foreground/90">{service.highlight}</p>
                </div>
              )}

              {service.images && service.images.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {service.images.map((image) => (
                    <figure key={image.src} className="glass overflow-hidden rounded-xl border border-white/10">
                      <img src={image.src} alt={image.alt} className="block h-auto w-full" loading="lazy" />
                      <figcaption className="px-3 py-2 font-mono text-xs text-muted-foreground">{image.caption}</figcaption>
                    </figure>
                  ))}
                </div>
              )}

              <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
```

Run: `npm test -- sections/services-full.test` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/services-teaser.tsx src/components/sections/services-teaser.test.tsx src/components/sections/services-full.tsx src/components/sections/services-full.test.tsx
git commit -m "Add services teaser (Home) and full services listing (Services page)"
```

---

### Task 11: WhyUs, PricingTable, VouchesCTA, FinalCTA

**Files:**
- Create: `src/components/sections/why-us.tsx`
- Create: `src/components/sections/why-us.test.tsx`
- Create: `src/components/sections/pricing-table.tsx`
- Create: `src/components/sections/pricing-table.test.tsx`
- Create: `src/components/sections/vouches-cta.tsx`
- Create: `src/components/sections/final-cta.tsx`

**Interfaces:**
- Consumes: `WHY_REASONS` (`@/content/why`), `PRICING_TIERS` (`@/content/pricing`), `SITE` (`@/content/site`), `Reveal` (`@/components/motion/reveal`), `Button` (`@/components/ui/button`)
- Produces: `WhyUs`, `PricingTable` (reused on both Home and Services), `VouchesCTA`, `FinalCTA`.

- [ ] **Step 1: Write the failing WhyUs test, then implement it**

Create `src/components/sections/why-us.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WhyUs } from "./why-us";
import { WHY_REASONS } from "@/content/why";

describe("WhyUs", () => {
  it("renders every reason", () => {
    render(<WhyUs />);
    for (const reason of WHY_REASONS) {
      expect(screen.getByText(reason.title)).toBeInTheDocument();
    }
  });
});
```

Run: `npm test -- sections/why-us.test` → FAIL

Create `src/components/sections/why-us.tsx`:

```tsx
import { Reveal } from "@/components/motion/reveal";
import { WHY_REASONS } from "@/content/why";

export function WhyUs() {
  return (
    <section id="why" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Why Away Tweaks</span>
          <h2 className="mt-4 font-display text-3xl font-bold text-gradient sm:text-4xl">
            Deep professional knowledge. Delivered fast.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_REASONS.map((reason, i) => {
            const Icon = reason.icon;
            return (
              <Reveal key={reason.title} delay={i * 0.05}>
                <div className="hover-lift glass flex h-full gap-4 rounded-2xl border border-white/5 p-6">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-electric/30 bg-electric/10">
                    <Icon className="h-5 w-5 text-electric" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{reason.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{reason.description}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

Run: `npm test -- sections/why-us.test` → PASS

- [ ] **Step 2: Write the failing PricingTable test, then implement it**

Create `src/components/sections/pricing-table.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PricingTable } from "./pricing-table";
import { PRICING_TIERS } from "@/content/pricing";

describe("PricingTable", () => {
  it("renders every tier with its price", () => {
    render(<PricingTable />);
    for (const tier of PRICING_TIERS) {
      expect(screen.getByText(tier.name)).toBeInTheDocument();
      expect(screen.getByText(`${tier.price}€`)).toBeInTheDocument();
    }
  });

  it("marks the featured tier as most popular", () => {
    render(<PricingTable />);
    expect(screen.getByText("Most popular")).toBeInTheDocument();
  });
});
```

Run: `npm test -- sections/pricing-table.test` → FAIL

Create `src/components/sections/pricing-table.tsx`:

```tsx
import Link from "next/link";
import { Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { PRICING_TIERS } from "@/content/pricing";

export function PricingTable() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Discount Packages</span>
          <h2 className="mt-4 font-display text-3xl font-bold text-gradient sm:text-4xl">Bundles that save you more.</h2>
          <p className="mt-4 text-muted-foreground">Stack services and pay less. Need something custom? Just ask — we build to spec.</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {PRICING_TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.06}>
              <div
                className={`hover-lift relative flex h-full flex-col rounded-3xl p-6 ${
                  tier.featured ? "glass-strong border border-electric/40" : "glass border border-white/5"
                }`}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-electric to-cyan-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-background">
                    Most popular
                  </span>
                )}
                <div className="font-display text-lg font-semibold">{tier.name}</div>
                <div className="mt-4 font-display text-4xl font-bold text-gradient">{tier.price}€</div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tier.description}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground/90">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className="mt-7">
                  <Button variant={tier.featured ? "primary" : "outline"} className="w-full">
                    Choose
                  </Button>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Run: `npm test -- sections/pricing-table.test` → PASS

- [ ] **Step 3: Implement VouchesCTA and FinalCTA (no dedicated tests — static CTA sections, exercised via the Home page test in Task 12)**

Create `src/components/sections/vouches-cta.tsx`:

```tsx
import Link from "next/link";
import { Disc } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { SITE } from "@/content/site";

export function VouchesCTA() {
  return (
    <section id="vouches" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Private Vouches</span>
          <h2 className="mt-4 font-display text-3xl font-bold text-gradient sm:text-4xl">The proof is in the Discord.</h2>
          <p className="mt-4 text-muted-foreground">
            No staged testimonials here. Every vouch is written by a real client in our server —
            read them all, raw and unfiltered, then decide for yourself.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={SITE.discordVouchesUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg">
                <Disc className="h-4 w-4" /> Read the vouches
              </Button>
            </a>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Get optimized
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
```

Create `src/components/sections/final-cta.tsx`:

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <Reveal>
          <div className="glass-strong rounded-3xl border border-white/10 p-10 sm:p-16">
            <h2 className="font-display text-3xl font-bold text-gradient sm:text-4xl">Ready to dominate?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join the players who stopped blaming their hardware. Get your rig tuned by Away Tweaks.
            </p>
            <Link href="/contact" className="mt-8 inline-block">
              <Button size="lg">
                Get Optimized <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/why-us.tsx src/components/sections/why-us.test.tsx src/components/sections/pricing-table.tsx src/components/sections/pricing-table.test.tsx src/components/sections/vouches-cta.tsx src/components/sections/final-cta.tsx
git commit -m "Add WhyUs, PricingTable, VouchesCTA, and FinalCTA sections"
```

---

### Task 12: Home page and JSON-LD

**Files:**
- Create: `src/components/seo/json-ld.tsx`
- Create: `src/components/seo/json-ld.test.tsx`
- Modify: `src/app/page.tsx` (replace create-next-app default)
- Create: `src/app/page.test.tsx`

**Interfaces:**
- Consumes: every section from Tasks 8–11, `SERVICES` (`@/content/services`), `SITE` (`@/content/site`)
- Produces: `JsonLd` component; the Home page at `/`.

- [ ] **Step 1: Write the failing JsonLd test**

Create `src/components/seo/json-ld.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonLd } from "./json-ld";
import { SERVICES } from "@/content/services";

describe("JsonLd", () => {
  it("embeds a script tag with an offer for every service", () => {
    const { container } = render(<JsonLd />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const data = JSON.parse(script!.innerHTML);
    const offers = data["@graph"][1].hasOfferCatalog.itemListElement;
    expect(offers).toHaveLength(SERVICES.length);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- seo/json-ld.test`
Expected: FAIL — `Cannot find module './json-ld'`

- [ ] **Step 3: Implement JsonLd**

Create `src/components/seo/json-ld.tsx`:

```tsx
import { SERVICES } from "@/content/services";
import { SITE } from "@/content/site";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: "en",
      },
      {
        "@type": "ProfessionalService",
        "@id": `${SITE.url}/#business`,
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        priceRange: "€€",
        areaServed: { "@type": "Place", name: "Worldwide" },
        sameAs: [SITE.discordServerUrl],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "PC Optimization Services",
          itemListElement: SERVICES.map((service) => ({
            "@type": "Offer",
            priceCurrency: "EUR",
            price: String(service.priceValue),
            itemOffered: { "@type": "Service", name: service.title, description: service.summary },
          })),
        },
      },
    ],
  };

  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- seo/json-ld.test`
Expected: PASS

- [ ] **Step 5: Write the failing Home page test**

Create `src/app/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("gsap", () => ({
  gsap: { registerPlugin: vi.fn(), fromTo: vi.fn(() => ({ scrollTrigger: { kill: vi.fn() }, kill: vi.fn() })) },
}));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {} }));

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the hero heading before the pricing heading in document order", () => {
    render(<HomePage />);
    const headings = [
      ...screen.getAllByRole("heading", { level: 1 }),
      ...screen.getAllByRole("heading", { level: 2 }),
    ];
    const heroIndex = headings.findIndex((h) => h.textContent === "Away Tweaks.");
    const pricingIndex = headings.findIndex((h) => h.textContent === "Bundles that save you more.");
    expect(heroIndex).toBeGreaterThanOrEqual(0);
    expect(pricingIndex).toBeGreaterThan(heroIndex);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm test -- app/page.test`
Expected: FAIL (current `page.tsx` is still the `create-next-app` default)

- [ ] **Step 7: Implement the Home page**

Replace `src/app/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { TrustMarquee } from "@/components/sections/trust-marquee";
import { Manifesto } from "@/components/sections/manifesto";
import { VideoShowcase } from "@/components/sections/video-showcase";
import { ServicesTeaser } from "@/components/sections/services-teaser";
import { WhyUs } from "@/components/sections/why-us";
import { PricingTable } from "@/components/sections/pricing-table";
import { VouchesCTA } from "@/components/sections/vouches-cta";
import { FinalCTA } from "@/components/sections/final-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: `${SITE.name} — Elite PC Optimization for Competitive Gamers`,
  description: SITE.description,
  alternates: { canonical: SITE.url },
  openGraph: {
    title: `${SITE.name} — Elite PC Optimization for Competitive Gamers`,
    description: SITE.description,
    url: SITE.url,
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <Hero />
      <TrustMarquee />
      <Manifesto />
      <VideoShowcase />
      <ServicesTeaser />
      <WhyUs />
      <PricingTable />
      <VouchesCTA />
      <FinalCTA />
    </>
  );
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npm test -- app/page.test`
Expected: PASS

- [ ] **Step 9: Verify the full build**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 10: Commit**

```bash
git add src/components/seo src/app/page.tsx src/app/page.test.tsx
git commit -m "Compose the Home page from all sections; add JSON-LD structured data"
```

---

### Task 13: Services page

**Files:**
- Create: `src/app/services/page.tsx`
- Create: `src/app/services/page.test.tsx`

**Interfaces:**
- Consumes: `ServicesFull`, `PricingTable`, `FinalCTA` (Tasks 10–11), `Reveal` (Task 5), `SITE` (Task 3)
- Produces: the Services page at `/services`.

- [ ] **Step 1: Write the failing test**

Create `src/app/services/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ServicesPage from "./page";
import { SERVICES } from "@/content/services";
import { PRICING_TIERS } from "@/content/pricing";

describe("ServicesPage", () => {
  it("renders full detail for every service and repeats every pricing tier", () => {
    render(<ServicesPage />);
    for (const service of SERVICES) {
      expect(screen.getByRole("heading", { name: service.title })).toBeInTheDocument();
    }
    for (const tier of PRICING_TIERS) {
      expect(screen.getByText(tier.name)).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app/services/page.test`
Expected: FAIL — `Cannot find module './page'`

- [ ] **Step 3: Implement the Services page**

Create `src/app/services/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { ServicesFull } from "@/components/sections/services-full";
import { PricingTable } from "@/components/sections/pricing-table";
import { FinalCTA } from "@/components/sections/final-cta";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Services & Pricing",
  description:
    "Windows tuning, custom gaming OS, CPU/GPU/RAM overclocking, network and BIOS tuning — every Away Tweaks service in detail, with pricing.",
  alternates: { canonical: `${SITE.url}/services` },
};

export default function ServicesPage() {
  return (
    <>
      <section className="relative pt-40 pb-16 sm:pt-48">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Services</span>
            <h1 className="mt-4 font-display text-4xl font-bold text-gradient sm:text-5xl">
              Every tune we run, in detail.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              No copy-paste presets. Every service below is a hands-on tune, validated for hours
              against your exact hardware.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <ServicesFull />
        </div>
      </section>

      <PricingTable />
      <FinalCTA />
    </>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- app/services/page.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/services
git commit -m "Add Services page with full service detail and repeated pricing"
```

---

### Task 14: About page

**Files:**
- Create: `src/app/about/page.tsx`
- Create: `src/app/about/page.test.tsx`

**Interfaces:**
- Consumes: `ABOUT` (`@/content/about`), `SITE` (`@/content/site`), `Reveal`/`Counter` (Task 5), `Button` (Task 2)
- Produces: the About page at `/about`.

- [ ] **Step 1: Write the failing test**

Create `src/app/about/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage from "./page";
import { ABOUT } from "@/content/about";

describe("AboutPage", () => {
  it("renders the hero title and every method step", () => {
    render(<AboutPage />);
    expect(screen.getByRole("heading", { name: ABOUT.heroTitle })).toBeInTheDocument();
    for (const step of ABOUT.methodSteps) {
      expect(screen.getByRole("heading", { name: step.title })).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- app/about/page.test`
Expected: FAIL — `Cannot find module './page'`

- [ ] **Step 3: Implement the About page**

Create `src/app/about/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Counter } from "@/components/motion/counter";
import { Button } from "@/components/ui/button";
import { ABOUT } from "@/content/about";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: "Away Tweaks is a private PC optimization service for competitive gamers — our mission, method, and results.",
  alternates: { canonical: `${SITE.url}/about` },
};

export default function AboutPage() {
  return (
    <>
      <section className="relative pt-40 pb-16 sm:pt-48">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">{ABOUT.eyebrow}</span>
            <h1 className="mt-4 font-display text-4xl font-bold text-gradient sm:text-5xl">{ABOUT.heroTitle}</h1>
            <p className="mt-5 leading-relaxed text-muted-foreground">{ABOUT.heroBody}</p>
          </Reveal>
        </div>
      </section>

      <section className="relative py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{ABOUT.missionTitle}</h2>
            <p className="mt-4 leading-relaxed text-foreground/85">{ABOUT.missionBody}</p>
          </Reveal>
        </div>
      </section>

      <section className="relative py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal className="text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Our method</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT.methodSteps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.06}>
                <div className="glass hover-lift h-full rounded-2xl border border-white/5 p-6">
                  <div className="font-mono text-xs text-electric">0{i + 1}</div>
                  <h3 className="mt-2 font-display font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:gap-6 sm:px-6">
          {SITE.stats.map((stat) => (
            <div key={stat.label} className="glass rounded-2xl border border-white/5 p-5 text-center">
              <div className="font-display text-2xl font-bold text-gradient sm:text-3xl">
                <Counter to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <div className="glass-strong rounded-3xl border border-white/10 p-10 sm:p-14">
              <h2 className="font-display text-3xl font-bold text-gradient">{ABOUT.ctaTitle}</h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{ABOUT.ctaBody}</p>
              <Link href="/contact" className="mt-8 inline-block">
                <Button size="lg">
                  Get Optimized <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- app/about/page.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/about
git commit -m "Add About page with drafted mission, method, and stats content"
```

---

### Task 15: Contact page and form

**Files:**
- Create: `src/components/sections/contact-form.tsx`
- Create: `src/components/sections/contact-form.test.tsx`
- Create: `src/app/contact/page.tsx`
- Create: `src/app/contact/page.test.tsx`

**Interfaces:**
- Consumes: `submitContactForm`, `ContactActionState` (`@/actions/contact`, Task 7), `Button`/`Input`/`Textarea` (Task 2), `SITE` (Task 3)
- Produces: `ContactForm` component; the Contact page at `/contact`.

- [ ] **Step 1: Write the failing ContactForm test**

Create `src/components/sections/contact-form.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/contact", () => ({
  submitContactForm: vi.fn(async (_prev: unknown, formData: FormData) => {
    const name = formData.get("name");
    if (!name) return { status: "error", message: "Enter your name" };
    return { status: "success" };
  }),
}));

import { ContactForm } from "./contact-form";

describe("ContactForm", () => {
  it("shows a success message after a valid submission", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("Name"), "Logan");
    await user.type(screen.getByLabelText("Discord Username"), "logan#0001");
    await user.type(screen.getByLabelText("Message"), "Need my rig tuned for Valorant.");
    await user.click(screen.getByRole("button", { name: /Send Request/i }));

    expect(await screen.findByText("Request sent.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- sections/contact-form.test`
Expected: FAIL — `Cannot find module './contact-form'`

- [ ] **Step 3: Implement ContactForm**

Create `src/components/sections/contact-form.tsx`:

```tsx
"use client";

import { useActionState, useEffect, useRef } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm, type ContactActionState } from "@/actions/contact";

const initialState: ContactActionState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="glass rounded-2xl border border-electric/30 p-8 text-center">
        <h3 className="font-display text-xl font-semibold text-gradient">Request sent.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll reply within 24 hours. In the meantime, feel free to join our Discord.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="startedAt" value={startedAtRef.current} />
      <div className="hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Name
        </label>
        <Input id="name" name="name" placeholder="Your name" required className="mt-1.5" />
      </div>

      <div>
        <label htmlFor="discord" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Discord Username
        </label>
        <Input id="discord" name="discord" placeholder="yourtag" required className="mt-1.5" />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="specs" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          PC Specs
        </label>
        <Input id="specs" name="specs" placeholder="CPU / GPU / RAM" className="mt-1.5" />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="message" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Message
        </label>
        <Textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Games you play, current issues, goals…"
          className="mt-1.5"
        />
      </div>

      {state.status === "error" && (
        <div className="sm:col-span-2">
          <p className="text-sm text-red-400">
            {state.message} You can also email{" "}
            <a href="mailto:Mattiaarminante77@gmail.com" className="underline">
              Mattiaarminante77@gmail.com
            </a>{" "}
            directly.
          </p>
        </div>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          <Mail className="h-4 w-4" /> {pending ? "Sending…" : "Send Request"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- sections/contact-form.test`
Expected: PASS

- [ ] **Step 5: Write the failing Contact page test**

Create `src/app/contact/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/contact", () => ({
  submitContactForm: vi.fn(async () => ({ status: "idle" })),
}));

import ContactPage from "./page";
import { SITE } from "@/content/site";

describe("ContactPage", () => {
  it("shows the business email and Discord link", () => {
    render(<ContactPage />);
    expect(screen.getByText(SITE.email)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Join our Discord/i })).toHaveAttribute("href", SITE.discordServerUrl);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm test -- app/contact/page.test`
Expected: FAIL — `Cannot find module './page'`

- [ ] **Step 7: Implement the Contact page**

Create `src/app/contact/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Mail, Disc, HardDrive } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/sections/contact-form";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Tell Away Tweaks about your rig and what you play — get a tailored PC optimization plan within 24 hours.",
  alternates: { canonical: `${SITE.url}/contact` },
};

export default function ContactPage() {
  return (
    <section className="relative pt-40 pb-24 sm:pt-48">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="glass-strong rounded-3xl border border-white/10 p-8 sm:p-14">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-electric">Contact</span>
              <h1 className="mt-4 font-display text-3xl font-bold text-gradient sm:text-4xl">
                Ready to maximize your gaming performance?
              </h1>
              <p className="mt-4 text-muted-foreground">
                Tell us about your rig and what you play. We&apos;ll come back with a tailored
                optimization plan within 24 hours.
              </p>
              <div className="mt-8 space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4 text-electric" />
                  <a href={`mailto:${SITE.email}`} className="break-all hover:text-electric">
                    {SITE.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Disc className="h-4 w-4 text-electric" />
                  <a href={SITE.discordServerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-electric">
                    Join our Discord
                  </a>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <HardDrive className="h-4 w-4 text-electric" /> Remote sessions worldwide
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <ContactForm />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npm test -- app/contact/page.test`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/sections/contact-form.tsx src/components/sections/contact-form.test.tsx src/app/contact
git commit -m "Add Contact page with server-action-backed form and honeypot spam guard"
```

---

### Task 16: SEO — sitemap, robots, llms.txt

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/sitemap.test.ts`
- Create: `src/app/robots.ts`
- Create: `src/app/robots.test.ts`
- Modify: `public/llms.txt`

**Interfaces:**
- Consumes: `SITE` (`@/content/site`)
- Produces: `sitemap` default export (`src/app/sitemap.ts`), `robots` default export (`src/app/robots.ts`).

- [ ] **Step 1: Write the failing sitemap test**

Create `src/app/sitemap.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { SITE } from "@/content/site";

describe("sitemap", () => {
  it("includes all four pages", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(SITE.url);
    expect(urls).toContain(`${SITE.url}/services`);
    expect(urls).toContain(`${SITE.url}/about`);
    expect(urls).toContain(`${SITE.url}/contact`);
  });
});
```

- [ ] **Step 2: Run it to verify it fails, then implement sitemap.ts**

Run: `npm test -- app/sitemap.test` → FAIL

Create `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/services", "/about", "/contact"];
  return routes.map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
```

Run: `npm test -- app/sitemap.test` → PASS

- [ ] **Step 3: Write the failing robots test, then implement robots.ts**

Create `src/app/robots.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import robots from "./robots";
import { SITE } from "@/content/site";

describe("robots", () => {
  it("points to the sitemap and allows all crawling", () => {
    const result = robots();
    expect(result.sitemap).toBe(`${SITE.url}/sitemap.xml`);
    expect(result.rules).toMatchObject({ userAgent: "*", allow: "/" });
  });
});
```

Run: `npm test -- app/robots.test` → FAIL

Create `src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
```

Run: `npm test -- app/robots.test` → PASS

- [ ] **Step 4: Update llms.txt for the multi-page structure**

Replace `public/llms.txt`:

```
# Away Tweaks

> Private, professional PC optimization for competitive gamers — custom gaming OS, CPU/GPU/RAM overclocking, BIOS, network and latency tuning for higher FPS and lower input delay.

Away Tweaks is a private PC tuning and optimization service for competitive players. We tune every layer of the system — from the operating system down to the hardware — to maximize in-game performance and minimize input latency. Every change is reversible, stability-tested, and benchmarked before and after.

## Pages
- Home: https://awaytweaks.com/
- Services & pricing: https://awaytweaks.com/services
- About: https://awaytweaks.com/about
- Contact: https://awaytweaks.com/contact

## Services
- Windows Tuning (25€): Custom Gaming OS (AwayOS) + deep Windows tune — bloat/telemetry/ad removal, dxgkrnl + kernel registry tuning, scheduler/services trim, driver configuration, devices configuration, peripherals registry configuration, game configuration.
- GPU Overclocking (15€): core/memory offsets, power and voltage limits, fan curves, sustained-boost validation.
- RAM Overclocking (45€): tight primary/sub-timings, stable high-frequency profiles, die-specific tuning (B-die, D-die, Hynix, Micron).
- CPU Overclocking (25€): per-core curves, PBO + Curve Optimizer (AMD) or voltage/frequency scaling (Intel).
- Network Tuning (10€): NIC/driver/QoS/DNS tuning, ISR/DPC latency reduction.
- BIOS Tuning (12€): hidden + visible settings, Resizable BAR / Above 4G, XMP/EXPO, C-states, PCIe/chipset tuning.

## Discount bundles
- Standard 35€ (Windows + BIOS), Entry Level 45€ (+ GPU OC), High Entry 52€ (+ CPU OC), Pro 65€ (CPU + GPU OC), Extreme 90€ (CPU + GPU + RAM OC).

## Contact
- Email: Mattiaarminante77@gmail.com
- Discord (server): https://discord.gg/saKde8DD9
- Discord (read client vouches): https://discord.gg/29Swpe8rM
- Website: https://awaytweaks.com/
```

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts src/app/sitemap.test.ts src/app/robots.ts src/app/robots.test.ts public/llms.txt
git commit -m "Add sitemap, robots, and updated llms.txt for the multi-page site"
```

---

### Task 17: Final QA pass

**Files:** none created — verification only.

- [ ] **Step 1: Run the full automated suite**

```bash
npm run lint
npm test
npm run build
```

Expected: all three succeed with zero errors/failures.

- [ ] **Step 2: Manual desktop browser walkthrough**

Run `npm run dev`, then in a browser visit `/`, `/services`, `/about`, `/contact`. Confirm for each:
- Nav highlights the current page and every link navigates correctly.
- Discord banner and footer render and their links point to the real Discord/email URLs from `SITE`.
- All 6 services and their exact prices appear on both Home (teaser) and Services (full detail).
- All 5 pricing tiers and prices appear on both Home and Services, with "Pro Level" marked "Most popular".
- The AwayOS video autoplays muted, loops the 25s clip, and cannot be clicked through to YouTube.
- Scrolling past the video section triggers the pin-and-scale reveal smoothly (no visible jank) — compare by throttling CPU 4x in DevTools.
- The contact form: submitting with a name/discord/message shows "Request sent."; submitting with a field missing shows the inline error with the `mailto:` fallback.

- [ ] **Step 3: Manual mobile responsive pass**

Using DevTools device toolbar (or `resize_window` in the browser tool) at 375×812 and 768×1024, repeat the walkthrough from Step 2 on all 4 pages. Confirm: the nav collapses to the hamburger menu and opens/closes correctly, the pricing grid and service cards stack to a single column without overflow, and no element causes horizontal scroll on the page body.

- [ ] **Step 4: Note the remaining asset dependency**

Confirm `public/logo.svg`, `public/awayos-desktop.svg`, and `public/awayos-setup.svg` are still placeholders. Once the user supplies the real logo and AwayOS screenshots, replace these files (keep the same filenames, or update the `src` references in `nav.tsx`, `footer.tsx`, `hero.tsx`, and `content/services.ts` if the real files use different names/extensions).

- [ ] **Step 5: Final commit (only if Steps 1–3 required fixes)**

```bash
git add -A
git commit -m "Fix issues found in final QA pass"
```
