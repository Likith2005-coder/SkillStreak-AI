// Roadmap route skeleton: the shape of the cinematic banner and the first few
// trail orbs, so the page fills in rather than blinking from a spinner.
export default function Loading() {
  const offsets = [0, 70, 100, 70, 0];
  return (
    <main className="container px-4 py-8" role="status" aria-label="Loading roadmap">
      <div className="h-11 w-32 animate-pulse rounded-lg bg-white/[0.04] motion-reduce:animate-none" />
      <div className="card-chunky mt-2 h-[260px] animate-pulse motion-reduce:animate-none" />
      <div className="mt-14 flex flex-col items-center gap-12">
        {offsets.map((x, i) => (
          <div
            key={i}
            className="relative h-16 w-16 animate-pulse rounded-full border border-white/10 bg-white/[0.04] motion-reduce:animate-none"
            style={{ left: x }}
          />
        ))}
      </div>
    </main>
  );
}
