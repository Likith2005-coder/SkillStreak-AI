/**
 * Generic full-viewport loader for Next.js loading.tsx route boundaries.
 * Sized so the navbar still shows above and the screen doesn't blink to
 * blank during a route transition. Three chunky dots hop in turn — the
 * playground's "thinking" beat.
 */
export function PageLoader({ hint }: { hint?: string }) {
  const dots = ["bg-primary-bright", "bg-secondary-bright", "bg-energy-bright"];
  return (
    <div
      role="status"
      aria-label={hint ?? "Loading"}
      className="container flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 py-20"
    >
      <div className="flex items-end gap-2.5" aria-hidden>
        {dots.map((c, i) => (
          <span
            key={c}
            className={`sticker-bob h-4 w-4 rounded-full ${c}`}
            style={{ animationDuration: "0.9s", animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      {hint && <p className="text-base font-bold text-muted-foreground">{hint}</p>}
    </div>
  );
}
