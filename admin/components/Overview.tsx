"use client";

import { useEffect, useState } from "react";
import { Activity, BookCheck, Loader2, TrendingUp, Users } from "lucide-react";
import { api, type Metrics } from "@/lib/api";
import { Card } from "./ui";

export function Overview() {
  const [m, setM] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.metrics().then(setM).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!m)
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading metrics…
      </div>
    );

  const stats = [
    { label: "Total users", value: m.users.total, sub: `+${m.users.newLast24h} today`, icon: Users, tone: "text-cyan-300" },
    { label: "Active (24h)", value: m.users.activeLast24h, sub: `${m.users.activeLast30d} in 30d`, icon: Activity, tone: "text-lime-300" },
    { label: "Topics completed", value: m.learning.topicsCompleted, sub: `+${m.learning.topicsCompletedLast24h} today`, icon: BookCheck, tone: "text-violet-300" },
    { label: "Quiz attempts", value: m.learning.quizAttempts, sub: `+${m.learning.quizAttemptsLast24h} today`, icon: TrendingUp, tone: "text-amber-300" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.tone}`} />
            </div>
            <div className="mt-2 text-3xl font-bold">{(s.value ?? 0).toLocaleString()}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-sm font-semibold">Most completed topics</h3>
        {(m.popular ?? []).length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No completions yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {m.popular.map((t, i) => (
              <li key={t.topicId} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-3">
                  <span className="w-5 text-right font-mono text-xs text-muted-foreground">{i + 1}</span>
                  {t.title}
                </span>
                <span className="font-mono text-xs text-cyan-300">{t.completions}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
