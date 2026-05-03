export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2" aria-label="Assistant is typing">
      <Dot delay="0ms" />
      <Dot delay="150ms" />
      <Dot delay="300ms" />
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70"
      style={{ animationDelay: delay }}
    />
  );
}
