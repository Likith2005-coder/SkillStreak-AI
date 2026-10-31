"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { Maximize2, Sparkles, X } from "lucide-react";
import { SignalBotStatic } from "@/components/3d/SignalBotStatic";
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
  const pathname = usePathname();

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

  // Screens with their own primary action at the bottom don't get the floating
  // key: on phones it would sit on top of the quiz's Continue, the roadmap's
  // "Skip" link, and the lesson (which has its own "Ask about this topic").
  // The tutor stays one tap away through the nav's Chat tab.
  if (
    pathname?.startsWith("/quiz") ||
    pathname?.startsWith("/topic/") ||
    /^\/domains\/[^/]+/.test(pathname ?? "")
  )
    return null;

  return (
    <>
      {/* Entrance lives on this wrapper; the button inside owns the press so
          framer-motion's transform never fights the active translate. */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 16, delay: reduce ? 0 : 0.4 }}
        className="fixed bottom-24 right-4 z-40 hidden md:bottom-6 md:right-6 md:block"
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Open chat"}
          aria-expanded={open}
          className={cn(
            "focus-ring group relative flex h-14 w-14 items-center justify-center rounded-full border transition-[transform,box-shadow,border-color] duration-200 ease-out hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100",
            open
              ? "border-white/15 bg-card text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_12px_32px_-12px_rgb(0_0_0/0.9)]"
              : "border-grape/50 bg-[radial-gradient(circle_at_35%_30%,hsl(var(--grape-bright)/0.55),hsl(var(--grape)/0.25)_45%,hsl(var(--card))_80%)] text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_0_0_1px_hsl(var(--grape)/0.25),0_0_32px_-4px_hsl(var(--grape)/0.7)]"
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="x"
                initial={reduce ? false : { rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={reduce ? undefined : { rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <X className="h-6 w-6" strokeWidth={2} />
              </motion.span>
            ) : (
              <motion.span
                key="chat"
                initial={reduce ? false : { rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={reduce ? undefined : { rotate: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Sparkles className="h-6 w-6 drop-shadow-[0_0_6px_hsl(var(--grape-bright))]" strokeWidth={1.75} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>

      <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label="AI chat"
          initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="card-chunky !fixed bottom-44 right-4 z-40 flex h-[60dvh] max-h-[640px] w-[calc(100vw-2rem)] max-w-md origin-bottom-right flex-col overflow-hidden md:bottom-24 md:right-6 md:h-[70dvh]"
        >
          <header className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-3 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span aria-hidden className="h-10 w-10 shrink-0 rounded-full bg-grape/10 p-0.5 ring-1 ring-grape/25">
                <SignalBotStatic className="h-full w-full" />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[15px] font-semibold leading-tight text-foreground">
                  SkillStreak <span className="font-serif-accent text-[1.1em] text-grape">AI</span>
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />
                </p>
                {topicTitle && (
                  <p className="truncate text-xs text-muted-foreground">{topicTitle}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center">
              <Link
                href={topicId ? `/chatbot?topic=${topicId}` : "/chatbot"}
                className="focus-ring flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
                aria-label="Open full chat"
                onClick={() => setOpen(false)}
              >
                <Maximize2 className="h-[18px] w-[18px]" strokeWidth={2} />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="focus-ring flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden">
            <ChatWindow
              compact
              emptyTitle={topicTitle ? `Ask about ${topicTitle}` : "Ask anything tech."}
              emptyHint="Your pocket tutor. Tap the expand icon for the full chat."
            />
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
