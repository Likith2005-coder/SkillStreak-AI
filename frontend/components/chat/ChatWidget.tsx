"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  const reduce = useReducedMotion();

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
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={reduce ? undefined : { scale: 1.08 }}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        className={cn(
          "group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_30px_rgba(99,102,241,0.5)] transition-shadow",
          "bg-gradient-to-br from-indigo-500 to-violet-500 hover:shadow-[0_10px_40px_rgba(139,92,246,0.7)]"
        )}
      >
        {/* Pulse ring while idle */}
        {!open && !reduce && (
          <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-indigo-500/30" />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Bot className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label="AI chat"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "fixed bottom-24 right-5 z-40 flex h-[70vh] max-h-[640px] w-[92vw] max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur-xl"
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
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
