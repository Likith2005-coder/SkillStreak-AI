"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { fetchHealth, type HealthResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

type State =
  | { kind: "loading" }
  | { kind: "ok"; data: HealthResponse }
  | { kind: "degraded"; data: HealthResponse }
  | { kind: "error" };

export function HealthIndicator() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const data = await fetchHealth();
      if (cancelled) return;
      if (!data) {
        setState({ kind: "error" });
      } else if (data.status === "ok") {
        setState({ kind: "ok", data });
      } else {
        setState({ kind: "degraded", data });
      }
    }

    check();
    const interval = setInterval(check, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-2xl border bg-card/50 px-5 py-3 text-sm backdrop-blur transition-colors",
        state.kind === "ok" && "border-emerald-500/30",
        state.kind === "degraded" && "border-amber-500/30",
        state.kind === "error" && "border-destructive/30",
        state.kind === "loading" && "border-border"
      )}
    >
      {state.kind === "loading" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Pinging backend…</span>
        </>
      )}

      {state.kind === "ok" && (
        <>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-foreground">Backend connected</span>
          <Dot color="emerald" label={`db ${state.data.checks.database}`} />
          <Dot color="emerald" label={`redis ${state.data.checks.redis}`} />
        </>
      )}

      {state.kind === "degraded" && (
        <>
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <span className="text-foreground">Backend degraded</span>
          <Dot
            color={state.data.checks.database === "up" ? "emerald" : "red"}
            label={`db ${state.data.checks.database}`}
          />
          <Dot
            color={state.data.checks.redis === "up" ? "emerald" : "red"}
            label={`redis ${state.data.checks.redis}`}
          />
        </>
      )}

      {state.kind === "error" && (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-foreground">Backend unreachable</span>
        </>
      )}
    </div>
  );
}

function Dot({
  color,
  label,
}: {
  color: "emerald" | "red";
  label: string;
}) {
  return (
    <span className="ml-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          color === "emerald" && "bg-emerald-400",
          color === "red" && "bg-red-400"
        )}
      />
      {label}
    </span>
  );
}
