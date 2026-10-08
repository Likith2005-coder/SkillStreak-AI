/**
 * Generic full-viewport loader for Next.js loading.tsx route boundaries.
 * Sized so the navbar still shows above and the screen doesn't blink to
 * blank during a route transition. Midnight: a thin volt arc orbiting a
 * hairline ring with a soft glow — an instrument warming up.
 */
export function PageLoader({ hint }: { hint?: string }) {
  return (
    <div
      role="status"
      aria-label={hint ?? "Loading"}
      className="container flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 py-20"
    >
      <div className="relative h-10 w-10" aria-hidden>
        <span className="absolute inset-0 rounded-full border border-white/10" />
        <span className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-primary shadow-[0_0_16px_-2px_hsl(var(--primary)/0.7)] [animation-duration:900ms] motion-reduce:[animation-duration:2.4s]" />
        <span className="absolute inset-[14px] rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.9)]" />
      </div>
      {hint && <p className="label-mono text-muted-foreground">{hint}</p>}
    </div>
  );
}
