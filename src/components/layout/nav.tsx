"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SITE } from "@/content/site";
import { scrollEngine } from "@/lib/scroll-engine";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Reads the shared engine rather than adding a second scroll listener, so
  // the condensed state flips on the same frame as everything else.
  useEffect(() => {
    scrollEngine.mount();
    return scrollEngine.subscribe(({ y }) => setScrolled(y > 24));
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 py-5">
      {/* The condense used to animate the header's padding, which reflows the
          bar on every frame of a 500ms transition each time the threshold is
          crossed. An 8px lift reads identically and stays on the compositor.
          It rides on the container so the open mobile menu travels with the
          bar rather than drifting away from it. */}
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 transition-transform duration-500 sm:px-6",
          scrolled && "-translate-y-2",
        )}
      >
        {/* `backdrop-filter` and gradient backgrounds aren't interpolable, so
            box-shadow is the only thing here that actually animates — naming
            it stops the browser watching every other property for a change. */}
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-2.5 transition-shadow duration-500 sm:px-5",
            scrolled
              ? "glass-strong shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]"
              : "bg-transparent",
          )}
        >
          <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl ring-1 ring-electric/40 shadow-glow">
              <Image src="/logo.png" alt="Away Tweaks logo" width={1024} height={1024} className="h-full w-full object-cover" />
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
            <Link href="/contact" className={buttonVariants({ size: "lg" })}>
              Get Optimized <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            className="glass grid h-11 w-11 place-items-center rounded-xl lg:hidden"
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
                className="flex min-h-11 items-center rounded-lg px-3 py-3 text-sm text-foreground/90 hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className={buttonVariants({ className: "mt-2 w-full" })}
            >
              Get Optimized
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
