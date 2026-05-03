"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatBootstrap } from "@/hooks/useChat";
import { ChatWindow } from "./ChatWindow";

type Props = {
  /** Optional pinned topic (passed to new sessions opened from this widget). */
  topicId?: string | null;
  topicTitle?: string | null;
};

export function ChatWidget({ topicId = null, topicTitle = null }: Props) {
  useChatBootstrap();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className={cn(
          "fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition",
          "bg-gradient-to-br from-indigo-500 to-violet-500 hover:scale-105 active:scale-95"
        )}
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="AI chat"
          className={cn(
            "fixed bottom-24 right-5 z-40 flex h-[70vh] max-h-[640px] w-[92vw] max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          )}
        >
          <header className="flex items-center justify-between border-b border-border bg-card/40 px-4 py-2.5 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                <Bot className="h-3.5 w-3.5" />
              </div>
              SkillStreak AI
              {topicTitle && (
                <span className="ml-1 truncate text-xs text-muted-foreground">
                  · {topicTitle}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Link
                href={topicId ? `/chatbot?topic=${topicId}` : "/chatbot"}
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-card hover:text-foreground"
                aria-label="Open full chat"
                onClick={() => setOpen(false)}
              >
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-card hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden">
            <ChatWindow
              emptyTitle={topicTitle ? `Ask about ${topicTitle}` : "Ask anything tech."}
              emptyHint="Floating tutor — opens full-screen with the icon above."
            />
          </div>
        </div>
      )}
    </>
  );
}
