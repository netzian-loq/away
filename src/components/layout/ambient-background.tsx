// A persistent, sitewide purple ambient wash behind all page content —
// a few large blurred blobs with a slow CSS-only drift (no JS, cheap
// transform-only animation). Kept separate from each section's own local
// decorative blur blobs, which stay scoped to their own sections.
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      <div
        className="aurora-blob absolute -top-1/4 -left-1/4 h-[50rem] w-[50rem] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.42 0.22 300 / 0.35) 0%, transparent 70%)",
          animation: "aurora-drift-a 36s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob absolute top-1/3 -right-1/4 h-[46rem] w-[46rem] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.44 0.23 330 / 0.28) 0%, transparent 70%)",
          animation: "aurora-drift-b 42s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob absolute -bottom-1/4 left-1/3 h-[46rem] w-[46rem] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, oklch(0.4 0.22 270 / 0.25) 0%, transparent 70%)",
          animation: "aurora-drift-c 48s ease-in-out infinite",
        }}
      />
    </div>
  );
}
