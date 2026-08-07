"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
    <header className={cn("fixed inset-x-0 top-0 z-40 transition-all duration-500", scrolled ? "py-3" : "py-5")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 sm:px-5",
            scrolled ? "glass-strong shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]" : "bg-transparent",
          )}
        >
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
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
