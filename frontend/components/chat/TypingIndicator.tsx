export function TypingIndicator() {
  return (
    <div className="flex h-7 items-center gap-1.5 px-0.5" role="status" aria-label="Assistant is typing">
      <Dot delay="0ms" />
      <Dot delay="160ms" />
      <Dot delay="320ms" />
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-pulse rounded-full bg-grape shadow-[0_0_8px_hsl(var(--grape)/0.8)] motion-reduce:animate-none"
      style={{ animationDelay: delay, animationDuration: "1.1s" }}
    />
  );
}
