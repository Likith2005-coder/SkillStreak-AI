"use client";

import { CornerDownRight } from "lucide-react";

type Props = {
  chips: string[];
  onPick: (text: string) => void;
};

export function FollowUpChips({ chips, onPick }: Props) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pl-11" aria-label="Suggested follow-ups">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onPick(chip)}
          className="focus-ring group inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-left text-sm text-foreground/90 transition-[border-color,background-color,color,box-shadow] duration-200 hover:border-secondary/40 hover:bg-secondary/[0.08] hover:text-foreground hover:shadow-[0_0_20px_-8px_hsl(var(--secondary)/0.7)] motion-reduce:transition-none"
        >
          <CornerDownRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-secondary" />
          {chip}
        </button>
      ))}
    </div>
  );
}
