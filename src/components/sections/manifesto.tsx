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
