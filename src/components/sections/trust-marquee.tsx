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
