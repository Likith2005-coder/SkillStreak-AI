/** Mirrors the /progress layout so nothing jumps when data lands. */
const PULSE = "animate-pulse bg-white/[0.04] motion-reduce:animate-none";

export function ProgressSkeleton() {
  return (
    <main className="container max-w-6xl px-4 py-8" aria-busy="true" aria-label="Loading progress">
      <div className={`h-11 w-44 rounded-lg ${PULSE}`} />
      <div className="card-chunky mt-3 p-6 sm:p-8">
        <div className="flex items-end justify-between gap-6">
          <div className="flex-1">
            <div className={`h-12 w-64 max-w-full rounded-lg ${PULSE}`} />
            <div className={`mt-4 h-5 w-40 rounded-md ${PULSE}`} />
          </div>
          <div className={`h-16 w-28 rounded-lg ${PULSE}`} />
        </div>
        <div className={`mt-6 h-2 w-full rounded-full ${PULSE}`} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card-chunky h-[108px] p-4 sm:p-5">
            <div className={`h-3 w-20 rounded ${PULSE}`} />
            <div className={`mt-6 h-8 w-16 rounded-md ${PULSE}`} />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card-chunky h-[320px]" />
        <div className="card-chunky h-[320px]" />
      </div>
      <div className="card-chunky mt-4 h-[180px]" />
    </main>
  );
}
