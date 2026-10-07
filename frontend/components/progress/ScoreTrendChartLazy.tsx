"use client";

/**
 * Lazy wrapper for the recharts score-trend chart. `ssr: false` keeps the
 * library out of the server bundle too; the placeholder matches the chart's
 * height so nothing shifts when it swaps in.
 */

import dynamic from "next/dynamic";
import type { ScoreTrendPoint } from "./ScoreTrendChart";

const ScoreTrendChart = dynamic(() => import("./ScoreTrendChart"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
  ),
});

export function ScoreTrendChartLazy({ data }: { data: ScoreTrendPoint[] }) {
  return <ScoreTrendChart data={data} />;
}
