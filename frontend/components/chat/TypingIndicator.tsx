export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1.5" role="status" aria-label="Assistant is typing">
      <Dot delay="0ms" />
      <Dot delay="150ms" />
      <Dot delay="300ms" />
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2.5 w-2.5 animate-bounce rounded-full bg-grape-bright motion-reduce:animate-none"
      style={{ animationDelay: delay }}
    />
  );
}
