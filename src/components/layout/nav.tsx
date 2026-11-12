"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CheckoutLink } from "@/components/layout/checkout-link";
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
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-3.5 sm:px-6">
      {/* A floating pill that tightens once the page moves: the bar narrows
          and drops 8px of height. Only this one element animates its size, and
          only for the half second after the threshold is crossed, so the
          reflow it costs is one small box rather than the page.
          It rides on the container so the open mobile menu stays under it. */}
      <div
        className={cn(
          "pointer-events-auto mx-auto transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled ? "max-w-[61rem]" : "max-w-7xl",
        )}
      >
        <div
          className={cn(
            "glass-strong flex items-center justify-between rounded-full pr-2 pl-2.5 transition-[height,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            scrolled
              ? "h-[54px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_40px_-16px_rgba(0,0,0,0.7)]"
              : "h-[62px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_40px_-22px_rgba(0,0,0,0.6)]",
          )}
        >
          <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full ring-1 ring-white/15">
              <Image src="/logo-mark.png" alt="Away Tweaks logo" width={512} height={512} className="h-full w-full object-cover" />
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
                  "rounded-full px-3.5 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-white/[0.07] text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:block">
            <CheckoutLink className={cn(buttonVariants(), "min-h-10 rounded-full px-5")}>
              Get Optimized <ArrowRight className="h-4 w-4" />
            </CheckoutLink>
          </div>

          <button
            className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="glass-strong mt-2 rounded-3xl p-3 lg:hidden">
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
            <CheckoutLink
              onClick={() => setOpen(false)}
              className={buttonVariants({ className: "mt-2 w-full" })}
            >
              Get Optimized
            </CheckoutLink>
          </div>
        )}
      </div>
    </header>
  );
}
