/** Mirrors the dashboard layout (path column + right rail) so nothing jumps. */
export default function Loading() {
  const pulse = "animate-pulse motion-reduce:animate-none";
  return (
    <main className="container px-4 py-8" aria-busy="true" aria-label="Loading your dashboard">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className={`h-10 w-72 max-w-full rounded-xl bg-muted ${pulse}`} />
          <div className={`mt-5 h-[120px] rounded-[1.5rem] bg-muted ${pulse}`} />
          <div className="mt-8 flex flex-col items-center gap-6 py-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-[72px] w-[72px] rounded-full bg-muted ${pulse}`}
                style={{ marginLeft: [0, 90, 0, -90][i] }}
              />
            ))}
          </div>
          <div className={`mt-10 h-7 w-48 rounded-lg bg-muted ${pulse}`} />
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className={`card-chunky h-64 ${pulse}`} />
            <div className="grid gap-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`h-[76px] rounded-2xl bg-muted ${pulse}`} />
              ))}
            </div>
          </div>
        </div>
        <aside className="hidden space-y-4 lg:block">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`card-chunky h-[52px] ${pulse}`} />
            ))}
          </div>
          <div className={`card-chunky h-[190px] ${pulse}`} />
          <div className={`card-chunky h-[120px] ${pulse}`} />
          <div className={`card-chunky h-[200px] ${pulse}`} />
        </aside>
      </div>
    </main>
  );
}
