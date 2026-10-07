/** Mirrors the /progress layout so nothing jumps when data lands. */
export function ProgressSkeleton() {
  return (
    <main className="container max-w-6xl px-4 py-8" aria-busy="true" aria-label="Loading progress">
      <div className="h-11 w-44 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <div className="card-chunky mt-3 p-6">
        <div className="h-9 w-56 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
        <div className="mt-3 h-5 w-40 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        <div className="mt-5 h-5 w-full animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card-chunky h-[84px] animate-pulse motion-reduce:animate-none" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card-chunky h-[320px] animate-pulse motion-reduce:animate-none" />
        <div className="card-chunky h-[320px] animate-pulse motion-reduce:animate-none" />
      </div>
      <div className="card-chunky mt-6 h-[180px] animate-pulse motion-reduce:animate-none" />
    </main>
  );
}
