"use client";

import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeatmapData } from "@/lib/api";

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
    <div className="card-chunky h-full p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-primary-bright"
            style={{ boxShadow: "0 4px 0 hsl(var(--primary-shade))" }}
          >
            <CalendarDays className="h-6 w-6 text-white" strokeWidth={2.6} />
          </span>
          <div>
            <h3 className="text-lg font-black text-foreground">Last 90 days</h3>
            <p className="text-sm font-bold text-muted-foreground">
              {data.totalActiveDays} active day{data.totalActiveDays === 1 ? "" : "s"} ·{" "}
              {data.totalActions} action{data.totalActions === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <Legend />
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {/* Weekday labels */}
        <div className="hidden flex-col gap-1 text-[11px] font-bold text-muted-foreground sm:flex">
          {WEEKDAY_LABELS.map((d, i) => (
            <span key={i} className="h-5 leading-5">
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
  if (!day) return <div className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />;
  const tone = bucket(day.count);
  const label = formatLabel(day.date, day.count);
  return (
    <div
      title={label}
      aria-label={label}
      className={cn(
        "h-4 w-4 rounded-[5px] transition-transform hover:scale-125 motion-reduce:transition-none sm:h-5 sm:w-5",
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

// Activity is progress, so the scale climbs through the brand greens.
const TONE_BG: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted ring-1 ring-inset ring-border",
  1: "bg-primary-bright/30",
  2: "bg-primary-bright/60",
  3: "bg-primary-bright",
  4: "bg-primary",
};

function formatLabel(iso: string, count: number): string {
  const d = new Date(iso + "T00:00:00Z");
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return count > 0 ? `${count} action${count === 1 ? "" : "s"} · ${date}` : `No activity · ${date}`;
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground" aria-hidden>
      <span className="mr-0.5">Less</span>
      {([0, 1, 2, 3, 4] as const).map((t) => (
        <span key={t} className={cn("h-4 w-4 rounded-[5px]", TONE_BG[t])} />
      ))}
      <span className="ml-0.5">More</span>
    </div>
  );
}
