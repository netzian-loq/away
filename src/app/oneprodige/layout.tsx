import { Barlow, Bebas_Neue } from "next/font/google";

// One Prodige's own type, as on oneprodige.com: Bebas Neue for titles, Barlow
// for text. Bound to the same CSS variables the site's type utilities read, so
// every `font-display` / `font-sans` inside the page switches over without a
// per-element class. Lives in this segment layout rather than the page so the
// page module stays renderable by the vitest suite, which has no next/font.
const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

/**
 * Wraps only the page body: the Away nav and footer come from the root layout
 * and keep their own look, so the page reads as Away Tweaks hosting 1P rather
 * than as a copy of their site. `.theme-1p` (globals.css) carries the palette.
 */
export default function OneProdigeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${bebas.variable} ${barlow.variable} theme-1p font-sans`}>{children}</div>
  );
}
