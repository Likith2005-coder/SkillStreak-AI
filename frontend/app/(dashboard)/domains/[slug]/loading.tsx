// Roadmap route skeleton: the shape of the unit banner and the first few
// trail nodes, so the page fills in rather than blinking from a spinner.
export default function Loading() {
  const offsets = [0, 70, 100, 70, 0];
  return (
    <main className="container px-4 py-8" role="status" aria-label="Loading roadmap">
      <div className="h-11 w-32 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <div className="mt-2 h-[180px] animate-pulse rounded-[1.5rem] bg-muted motion-reduce:animate-none" />
      <div className="mt-12 flex flex-col items-center gap-10">
        {offsets.map((x, i) => (
          <div
            key={i}
            className="relative h-20 w-20 animate-pulse rounded-full bg-muted motion-reduce:animate-none"
            style={{ left: x, boxShadow: "0 7px 0 hsl(var(--border))" }}
          />
        ))}
      </div>
    </main>
  );
}
