import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { SITE } from "@/content/site";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { AmbientBackground } from "@/components/layout/ambient-background";
import { CursorGlow } from "@/components/motion/cursor-glow";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
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
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

// Runs before first paint: flags a machine with no real GPU behind the canvas
// (software rasterisers like SwiftShader or llvmpipe) so the heavier motion
// layers — Lenis smooth scroll, the cursor glow, the scroll-linked effects —
// skip themselves rather than jank on hardware that can't afford them.
//
// Capability only. This deliberately does NOT check prefers-reduced-motion,
// which it used to: this project runs on a Windows VM that reports `reduce`
// unconditionally, so folding the preference in here silently disabled the
// entire scroll engine on the one machine the site is built and reviewed on.
// The `prefers-reduced-motion` media query in globals.css still stands down
// CSS animation and transitions for anyone who genuinely asks for it.
const PERF_LITE_INIT = `(function(){try{var r=document.documentElement;var c=document.createElement('canvas');var gl=c.getContext('webgl')||c.getContext('experimental-webgl');if(!gl){r.classList.add('perf-lite');return;}var e=gl.getExtension('WEBGL_debug_renderer_info');var n=e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'';if(/swiftshader|llvmpipe|software|microsoft basic render/i.test(String(n))){r.classList.add('perf-lite');}}catch(_){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: PERF_LITE_INIT }} />
        <SmoothScroll />
        <ScrollProgress />
        <AmbientBackground />
        <CursorGlow />
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
