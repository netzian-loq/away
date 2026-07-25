import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { ScrollWordReveal } from "@/components/motion/scroll-word-reveal";

const MANIFESTO_TEXT =
  "Your rig is capable of more. We strip Windows down to the metal, unlock the BIOS, " +
  "overclock the CPU, GPU and RAM, and validate every change for hours — until the only " +
  "limit left in your setup is you.";

export function Manifesto() {
  return (
    <section className="relative overflow-hidden py-32 sm:py-44">
      <Parallax className="absolute inset-0 -z-10" speed={50}>
        <div className="absolute top-1/2 left-1/2 h-[32rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,var(--electric-glow)_0%,transparent_70%)] blur-3xl opacity-40" />
      </Parallax>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-electric">The Away method</span>
        </Reveal>
        <ScrollWordReveal
          text={MANIFESTO_TEXT}
          highlights={["BIOS", "overclock", "CPU", "GPU", "RAM", "you"]}
          className="mt-6 font-display text-3xl font-bold leading-[1.15] tracking-tight sm:text-5xl"
        />
      </div>
    </section>
  );
}
