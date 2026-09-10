"use client";

/**
 * The quiz-score area chart, isolated so recharts can be code-split.
 *
 * Recharts is ~107 kB — a third of this route's JavaScript — for one 176px
 * chart that sits below the fold and renders nothing at all until the learner
 * has taken a quiz. Importing it lazily (see ScoreTrendChartLazy) keeps that
 * weight off the initial load of /progress.
 */

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ScoreTrendPoint = {
  idx: number;
  score: number;
  label: string;
  title: string;
  domain: string;
  passed: boolean;
};

export default function ScoreTrendChart({ data }: { data: ScoreTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.4} />
        <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis
          domain={[0, 5]}
          ticks={[0, 1, 2, 3, 4, 5]}
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "hsl(var(--muted-foreground))" }}
          formatter={(v) => [`${v}/5`, "Score"]}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#a78bfa"
          strokeWidth={2}
          fill="url(#scoreFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
