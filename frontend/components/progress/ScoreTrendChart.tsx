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

// Score is progress, so the line is volt; it glows (see the wrapper's
// drop-shadow on the curve) over a fill that fades into the panel.
const LINE = "hsl(var(--primary))";
const AXIS = "hsl(var(--muted-foreground))";
const HAIRLINE = "hsl(0 0% 100% / 0.06)";

export default function ScoreTrendChart({ data }: { data: ScoreTrendPoint[] }) {
  return (
    <div className="h-full w-full [&_.recharts-area-curve]:drop-shadow-[0_0_8px_hsl(var(--primary)/0.7)]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
              <stop offset="60%" stopColor="hsl(var(--aurora-2))" stopOpacity={0.06} />
              <stop offset="100%" stopColor="hsl(var(--aurora-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={HAIRLINE} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={AXIS}
            tick={{ fill: AXIS, fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={{ stroke: HAIRLINE }}
            tickMargin={8}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            stroke={AXIS}
            tick={{ fill: AXIS, fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--primary) / 0.35)", strokeWidth: 1, strokeDasharray: "3 3" }}
            contentStyle={{
              background: "hsl(var(--card) / 0.96)",
              border: "1px solid hsl(0 0% 100% / 0.1)",
              borderRadius: 10,
              boxShadow: "0 12px 32px -12px rgb(0 0 0 / 0.8), inset 0 1px 0 hsl(0 0% 100% / 0.06)",
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 600,
              color: "hsl(var(--foreground))",
            }}
            labelStyle={{ color: AXIS, fontWeight: 500, fontSize: 11, fontFamily: "var(--font-mono)", marginBottom: 2 }}
            itemStyle={{ color: "hsl(var(--primary))", padding: 0 }}
            formatter={(v) => [`${v}/5`, "Score"]}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={LINE}
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="url(#scoreFill)"
            dot={{ r: 3.5, fill: "hsl(var(--card))", stroke: LINE, strokeWidth: 2 }}
            activeDot={{ r: 5.5, fill: LINE, stroke: "hsl(var(--card))", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
