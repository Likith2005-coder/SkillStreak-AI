/** Mirrors the dashboard layout (welcome, hero panel + right rail) so nothing jumps. */
export default function Loading() {
  const pulse = "animate-pulse motion-reduce:animate-none";
  const bar = `rounded-lg bg-white/[0.06] ${pulse}`;
  return (
    <main className="container px-4 pb-16 pt-8 lg:pt-12" aria-busy="true" aria-label="Loading your dashboard">
      <div className={`h-3 w-36 ${bar}`} />
      <div className={`mt-5 h-16 w-[34rem] max-w-full ${bar}`} />
      <div className={`mt-4 h-4 w-96 max-w-full ${bar}`} />
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <div className="card-chunky grid min-h-[420px] gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_400px]">
            <div className="flex flex-col gap-3">
              <div className={`h-3 w-40 ${bar}`} />
              <div className={`h-10 w-4/5 ${bar}`} />
              <div className={`h-10 w-3/5 ${bar}`} />
              <div className={`mt-4 h-[3.25rem] w-44 rounded-xl bg-white/[0.06] ${pulse}`} />
            </div>
            <div className="hidden flex-col items-center gap-9 xl:flex">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`relative h-14 w-14 rounded-full border border-white/10 bg-white/[0.04] ${pulse}`}
                  style={{ left: [0, 44, 64, 44][i] }}
                />
              ))}
            </div>
          </div>
          <div className={`h-7 w-48 ${bar}`} />
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className={`card-chunky h-64 ${pulse}`} />
            <div className="grid gap-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`card-chunky h-[72px] ${pulse}`} />
              ))}
            </div>
          </div>
        </div>
        <aside className="hidden space-y-4 lg:block">
          <div className={`card-chunky h-[210px] ${pulse}`} />
          <div className={`card-chunky h-[120px] ${pulse}`} />
          <div className={`card-chunky h-[190px] ${pulse}`} />
          <div className="h-[120px] rounded-[1.1rem] border border-emerald-500/20 bg-[#030806]" />
        </aside>
      </div>
    </main>
  );
}
