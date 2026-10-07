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

const LINE = "hsl(var(--secondary-bright))";
const AXIS = "hsl(var(--muted-foreground))";

export default function ScoreTrendChart({ data }: { data: ScoreTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--secondary-bright))" stopOpacity={0.28} />
            <stop offset="100%" stopColor="hsl(var(--secondary-bright))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          stroke={AXIS}
          tick={{ fill: AXIS, fontSize: 12, fontWeight: 700 }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 2 }}
        />
        <YAxis
          domain={[0, 5]}
          ticks={[0, 1, 2, 3, 4, 5]}
          stroke={AXIS}
          tick={{ fill: AXIS, fontSize: 12, fontWeight: 700 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ stroke: "hsl(var(--border))", strokeWidth: 2 }}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "2px solid hsl(var(--border))",
            borderBottomWidth: 4,
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 800,
            color: "hsl(var(--foreground))",
          }}
          labelStyle={{ color: AXIS, fontWeight: 700 }}
          itemStyle={{ color: "hsl(var(--secondary))" }}
          formatter={(v) => [`${v}/5`, "Score"]}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke={LINE}
          strokeWidth={4}
          strokeLinecap="round"
          fill="url(#scoreFill)"
          dot={{ r: 5, fill: "hsl(var(--card))", stroke: LINE, strokeWidth: 3 }}
          activeDot={{ r: 7, fill: LINE, stroke: "hsl(var(--card))", strokeWidth: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
