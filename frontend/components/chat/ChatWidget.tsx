"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { Maximize2, MessageCircle, X } from "lucide-react";
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

  // A quiz is a focused session: the floating key would sit on top of the
  // quiz's full-width Continue key on phones. The tutor stays one tap away
  // through the nav's Chat tab.
  if (pathname?.startsWith("/quiz")) return null;

  return (
    <>
      {/* Entrance lives on this wrapper; the button inside owns the press so
          framer-motion's transform never fights the active translate. */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 16, delay: reduce ? 0 : 0.4 }}
        className="fixed bottom-24 right-4 z-40 md:bottom-6 md:right-6"
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Open chat"}
          aria-expanded={open}
          className={cn(
            "focus-ring flex h-14 w-14 items-center justify-center rounded-2xl text-white transition-[transform,box-shadow,filter] duration-100 ease-out hover:brightness-[1.06] motion-reduce:transition-none",
            "active:translate-y-[5px] active:shadow-none",
            open
              ? "bg-secondary shadow-[0_5px_0_hsl(var(--secondary-shade))]"
              : "bg-grape shadow-[0_5px_0_hsl(var(--grape-shade))]"
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
                <X className="h-7 w-7" strokeWidth={3} />
              </motion.span>
            ) : (
              <motion.span
                key="chat"
                initial={reduce ? false : { rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={reduce ? undefined : { rotate: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <MessageCircle className="h-7 w-7" strokeWidth={2.6} fill="currentColor" fillOpacity={0.25} />
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
          className="card-chunky fixed bottom-44 right-4 z-40 flex h-[60vh] max-h-[640px] w-[calc(100vw-2rem)] max-w-md origin-bottom-right flex-col overflow-hidden md:bottom-24 md:right-6 md:h-[70vh]"
        >
          <header className="flex items-center justify-between gap-2 border-b-2 border-border px-3 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span aria-hidden className="h-10 w-10 shrink-0 rounded-full bg-grape/10 p-0.5">
                <SignalBotStatic className="h-full w-full" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-black leading-tight text-foreground">SkillStreak AI</p>
                {topicTitle && (
                  <p className="truncate text-xs font-bold text-muted-foreground">{topicTitle}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center">
              <Link
                href={topicId ? `/chatbot?topic=${topicId}` : "/chatbot"}
                className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Open full chat"
                onClick={() => setOpen(false)}
              >
                <Maximize2 className="h-5 w-5" strokeWidth={2.6} />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" strokeWidth={3} />
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
