"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  onSend: (text: string) => void;
  onCancel?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

const MAX = 2000;

export function ChatInput({
  onSend,
  onCancel,
  isStreaming = false,
  placeholder = "Ask anything tech…",
  disabled = false,
}: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea up to 6 rows.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  const ready = !!value.trim() && !disabled;

  return (
    <div className="relative px-4 pb-3 pt-2">
      {/* Messages fade out under the composer instead of meeting a hard rule. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-background"
      />
      <div
        className={cn(
          "relative mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/10 bg-card p-2 pl-3",
          "shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_16px_40px_-20px_rgb(0_0_0/0.9)]",
          "transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none",
          "focus-within:border-primary/50 focus-within:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_4px_hsl(var(--primary)/0.1),0_0_48px_-16px_hsl(var(--primary)/0.55)]",
          // While the tutor is answering, a light sweeps the composer's rim.
          isStreaming && "border-beam"
        )}
      >
        <textarea
          aria-label="Message the AI tutor"
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={placeholder}
          className="relative min-h-[44px] w-full resize-none border-0 bg-transparent px-1 py-2.5 text-base leading-relaxed md:text-[0.95rem] text-foreground placeholder:text-muted-foreground focus:outline-none"
          disabled={disabled}
        />

        {isStreaming ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onCancel}
            aria-label="Stop generating"
            className="relative h-11 w-11 shrink-0"
          >
            <Square className="h-3.5 w-3.5" fill="currentColor" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={!ready}
            aria-label="Send message"
            className="relative h-11 w-11 shrink-0 disabled:bg-white/[0.08] disabled:text-muted-foreground disabled:opacity-100"
          >
            <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
          </Button>
        )}
      </div>
      <div className="mx-auto mt-2 flex max-w-3xl justify-between px-1 font-mono text-[11px] text-muted-foreground">
        {/* keyboard hint only matters where there is a keyboard */}
        <span className="hidden sm:inline">
          <kbd className="font-mono text-foreground/80">Enter</kbd> to send ·{" "}
          <kbd className="font-mono text-foreground/80">Shift+Enter</kbd> for newline
        </span>
        <span className="sm:hidden" />
        <span className={cn("tabular-nums", value.length > MAX * 0.9 && "text-energy")}>
          {value.length}/{MAX}
        </span>
      </div>
    </div>
  );
}
