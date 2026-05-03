import { Loader2 } from "lucide-react";

/**
 * Generic full-viewport loader for Next.js loading.tsx route boundaries.
 * Sized so the navbar still shows above and the screen doesn't blink to
 * blank during a route transition.
 */
export function PageLoader({ hint }: { hint?: string }) {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 py-20 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}
