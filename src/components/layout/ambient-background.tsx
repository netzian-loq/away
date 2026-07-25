// A persistent, sitewide purple ambient wash behind all page content —
// a deep violet base gradient plus a few large blurred blobs with a slow
// CSS-only drift (no JS, cheap transform-only animation). Kept separate
// from each section's own local decorative blur blobs, which stay scoped
// to their own sections.
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      {/* Base wash: violet at the top, near-black through the middle,
          purple again at the foot — reads as one deep purple room. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.17 0.09 305) 0%, oklch(0.11 0.06 300) 42%, oklch(0.14 0.08 310) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% -10%, oklch(0.34 0.16 305 / 0.5) 0%, transparent 60%)",
        }}
      />
      <div
        className="aurora-blob absolute -top-1/4 -left-1/4 h-[50rem] w-[50rem] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.45 0.24 300 / 0.5) 0%, transparent 70%)",
          animation: "aurora-drift-a 36s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob absolute top-1/3 -right-1/4 h-[46rem] w-[46rem] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.47 0.25 330 / 0.42) 0%, transparent 70%)",
          animation: "aurora-drift-b 42s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob absolute -bottom-1/4 left-1/3 h-[46rem] w-[46rem] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.42 0.23 270 / 0.38) 0%, transparent 70%)",
          animation: "aurora-drift-c 48s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob absolute top-1/4 left-1/4 h-[38rem] w-[38rem] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.5 0.22 315 / 0.28) 0%, transparent 70%)",
          animation: "aurora-drift-b 54s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}
