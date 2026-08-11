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

// Runs before first paint: flags reduced-motion preference or software
// rendering (no real GPU) so the heavier motion layers (Lenis smooth
// scroll, the cursor glow, ambient drift) can skip themselves instead of
// janking on a machine that can't afford them.
const PERF_LITE_INIT = `(function(){try{var r=document.documentElement;if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){r.classList.add('perf-lite');return;}var c=document.createElement('canvas');var gl=c.getContext('webgl')||c.getContext('experimental-webgl');if(!gl){r.classList.add('perf-lite');return;}var e=gl.getExtension('WEBGL_debug_renderer_info');var n=e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'';if(/swiftshader|llvmpipe|software|microsoft basic render/i.test(String(n))){r.classList.add('perf-lite');}}catch(_){}})();`;

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
