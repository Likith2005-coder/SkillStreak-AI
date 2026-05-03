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
    <div className="border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-card/50 p-2">
        <textarea
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
            "min-h-[36px] w-full resize-none border-0 bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
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
            className="h-9 w-9"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={!value.trim() || disabled}
            aria-label="Send message"
            className="h-9 w-9"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="mt-1.5 flex justify-between px-1 text-[10px] text-muted-foreground/70">
        <span>Enter to send · Shift+Enter for newline</span>
        <span>{value.length}/{MAX}</span>
      </div>
    </div>
  );
}
