"use client";

import { cn } from "@/lib/utils";
import type { HeatmapData } from "@/lib/api";

type Props = {
  data: HeatmapData;
};

const WEEKDAY_LABELS = ["Mon", "Wed", "Fri"];

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
    <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Last 90 days</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.totalActiveDays} active day{data.totalActiveDays === 1 ? "" : "s"} ·{" "}
            {data.totalActions} action{data.totalActions === 1 ? "" : "s"}
          </p>
        </div>
        <Legend />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {/* Weekday labels */}
        <div className="hidden flex-col justify-between pt-1 text-[10px] text-muted-foreground sm:flex">
          {WEEKDAY_LABELS.map((d) => (
            <span key={d} className="h-3 leading-3">
              {d}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
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
  if (!day) return <div className="h-3 w-3" aria-hidden />;
  const tone = bucket(day.count);
  const label = formatLabel(day.date, day.count);
  return (
    <div
      title={label}
      aria-label={label}
      className={cn(
        "h-3 w-3 rounded-sm transition-transform hover:scale-150",
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

const TONE_BG: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted/30",
  1: "bg-indigo-500/30",
  2: "bg-indigo-500/55",
  3: "bg-violet-500/75",
  4: "bg-fuchsia-500",
};

function formatLabel(iso: string, count: number): string {
  const d = new Date(iso + "T00:00:00Z");
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return count > 0 ? `${count} action${count === 1 ? "" : "s"} · ${date}` : `No activity · ${date}`;
}

function Legend() {
  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
      <span>Less</span>
      {([0, 1, 2, 3, 4] as const).map((t) => (
        <span key={t} className={cn("h-3 w-3 rounded-sm", TONE_BG[t])} />
      ))}
      <span>More</span>
    </div>
  );
}
