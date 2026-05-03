"use client";

import { Sparkles } from "lucide-react";

type Props = {
  chips: string[];
  onPick: (text: string) => void;
};

export function FollowUpChips({ chips, onPick }: Props) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      <Sparkles className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onPick(chip)}
          className="rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-card hover:text-foreground"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
