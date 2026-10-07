"use client";

type Props = {
  chips: string[];
  onPick: (text: string) => void;
};

export function FollowUpChips({ chips, onPick }: Props) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pl-12" aria-label="Suggested follow-ups">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => onPick(chip)}
          className="focus-ring min-h-[44px] rounded-2xl border-2 border-b-4 border-border bg-card px-4 py-2 text-left text-sm font-bold text-secondary transition-[transform,border-width,background-color] duration-100 hover:border-secondary-bright hover:bg-secondary/5 active:translate-y-[2px] active:border-b-2 motion-reduce:transition-none"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
