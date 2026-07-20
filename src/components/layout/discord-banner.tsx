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
