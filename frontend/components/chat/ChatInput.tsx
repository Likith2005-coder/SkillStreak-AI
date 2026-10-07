"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Square } from "lucide-react";
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

  return (
    <div className="border-t-2 border-border bg-background px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border-2 border-b-4 border-border bg-card p-2 transition-colors focus-within:border-secondary-bright">
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
          className={cn(
            "min-h-[44px] w-full resize-none border-0 bg-transparent px-2 py-2.5 text-[0.95rem] font-semibold text-foreground placeholder:font-semibold placeholder:text-muted-foreground focus:outline-none"
          )}
          disabled={disabled}
        />

        {isStreaming ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onCancel}
            aria-label="Stop generating"
            className="mb-1 shrink-0"
          >
            <Square className="h-4 w-4" fill="currentColor" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={!value.trim() || disabled}
            aria-label="Send message"
            variant="secondary"
            className="mb-1 shrink-0"
          >
            <Send className="h-5 w-5" strokeWidth={2.6} />
          </Button>
        )}
      </div>
      <div className="mx-auto mt-1.5 flex max-w-3xl justify-between px-1 text-xs font-semibold text-muted-foreground">
        {/* keyboard hint only matters where there is a keyboard */}
        <span className="hidden sm:inline">Enter to send · Shift+Enter for newline</span>
        <span className="sm:hidden" />
        <span>{value.length}/{MAX}</span>
      </div>
    </div>
  );
}
