"use client";

import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeatmapData } from "@/lib/api";
import type { CSSProperties } from "react";

type Props = {
  data: HeatmapData;
};

const WEEKDAY_LABELS = ["Sun", "", "Tue", "", "Thu", "", "Sat"];

export function Heatmap({ data }: Props) {
  // Group days into columns (weeks). Pad the start so the first column begins on Sunday.
  // This matches GitHub's contribution graph orientation: rows = weekday, columns = week.
  const days = data.days;
  if (!days.length) return null;

  // Find day-of-week for first day. JS getUTCDay: 0 = Sunday ... 6 = Saturday.
  const firstDow = new Date(days[0].date + "T00:00:00Z").getUTCDay();

  // Pad with nulls so the first real day lands in the right row.
  const padded: Array<{ date: string; count: number } | null> = [
    ...Array.from({ length: firstDow }, () => null),
    ...days,
  ];

  // Pad end to a full week.
  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: Array<Array<{ date: string; count: number } | null>> = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  return (
    <div className="card-chunky spotlight h-full p-5 sm:p-6" style={{ "--spot": "var(--primary)" } as CSSProperties}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20"
          >
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg text-foreground">Last 90 days</h3>
            <p className="text-sm text-muted-foreground">
              <span className="tabular-nums text-foreground">{data.totalActiveDays}</span> active day
              {data.totalActiveDays === 1 ? "" : "s"} ·{" "}
              <span className="tabular-nums text-foreground">{data.totalActions}</span> action
              {data.totalActions === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Legend />
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {/* Weekday labels */}
        <div className="hidden flex-col gap-1 font-mono text-[10px] text-muted-foreground sm:flex">
          {WEEKDAY_LABELS.map((d, i) => (
            <span key={i} className="h-4 leading-4 sm:h-[18px] sm:leading-[18px]">
              {d}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <Cell key={di} day={day} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({ day }: { day: { date: string; count: number } | null }) {
  if (!day) return <div className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden />;
  const tone = bucket(day.count);
  const label = formatLabel(day.date, day.count);
  return (
    <div
      title={label}
      aria-label={label}
      className={cn(
        "h-4 w-4 rounded-[4px] transition-transform hover:scale-125 motion-reduce:transition-none sm:h-[18px] sm:w-[18px]",
        TONE_BG[tone]
      )}
    />
  );
}

function bucket(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

// Activity is progress: dim squares that light up volt, glowing at the top end.
const TONE_BG: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-white/[0.04] ring-1 ring-inset ring-white/[0.05]",
  1: "bg-primary/25",
  2: "bg-primary/50 shadow-[0_0_6px_hsl(var(--primary)/0.25)]",
  3: "bg-primary/80 shadow-[0_0_10px_hsl(var(--primary)/0.45)]",
  4: "bg-primary shadow-[0_0_14px_hsl(var(--primary)/0.75)]",
};

function formatLabel(iso: string, count: number): string {
  const d = new Date(iso + "T00:00:00Z");
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return count > 0 ? `${count} action${count === 1 ? "" : "s"} · ${date}` : `No activity · ${date}`;
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground" aria-hidden>
      <span className="mr-0.5">Less</span>
      {([0, 1, 2, 3, 4] as const).map((t) => (
        <span key={t} className={cn("h-3 w-3 rounded-[3px]", TONE_BG[t])} />
      ))}
      <span className="ml-0.5">More</span>
    </div>
  );
}
