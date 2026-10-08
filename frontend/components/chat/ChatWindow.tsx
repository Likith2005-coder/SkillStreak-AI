"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Lightbulb, ListChecks, Map, PlayCircle, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/playground/Mascot";
import { useChatStore } from "@/store/chatStore";
import { useSendMessage } from "@/hooks/useChat";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { FollowUpChips } from "./FollowUpChips";
import { cn } from "@/lib/utils";

type Props = {
  emptyTitle?: string;
  emptyHint?: string;
  className?: string;
  /** Tighter empty state for the floating widget panel. */
  compact?: boolean;
};

// Each starter carries an icon and a role colour for its well + spotlight.
const STARTERS: Array<{ text: string; icon: LucideIcon; well: string; spot: string }> = [
  { text: "Explain CIA Triad with an analogy", icon: Lightbulb, well: "bg-xp/10 text-xp ring-xp/20", spot: "var(--xp)" },
  { text: "Give me a roadmap for backend dev", icon: Map, well: "bg-secondary/10 text-secondary ring-secondary/20", spot: "var(--secondary)" },
  { text: "Quiz me on REST vs GraphQL", icon: ListChecks, well: "bg-primary/10 text-primary ring-primary/20", spot: "var(--primary)" },
  { text: "Recommend YouTube videos on linear regression", icon: PlayCircle, well: "bg-grape/10 text-grape ring-grape/20", spot: "var(--grape)" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function ChatWindow({ emptyTitle, emptyHint, className, compact = false }: Props) {
  const messages = useChatStore((s) => s.messages);
  const followUps = useChatStore((s) => s.followUps);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const error = useChatStore((s) => s.error);
  const setError = useChatStore((s) => s.setError);
  const activeSession = useChatStore((s) => s.activeSession);
  const { send, regenerate, cancel } = useSendMessage();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);

  // Track whether the user has scrolled up; if so, don't auto-scroll on new tokens.
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  }

  useEffect(() => {
    if (!stickToBottomRef.current || messages.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, followUps]);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const canRegenerate =
    !isStreaming && lastAssistant && !lastAssistant.streaming && messages.some((m) => m.role === "user");

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn("flex-1 overflow-y-auto px-4", compact ? "py-4" : "py-8")}
      >
        {messages.length === 0 ? (
          <EmptyState
            title={
              emptyTitle ?? (
                <>
                  Ask anything <span className="font-serif-accent text-primary text-glow">tech.</span>
                </>
              )
            }
            hint={
              emptyHint ??
              "Explanations, roadmaps, quizzes, debugging — your AI tutor knows your level."
            }
            compact={compact}
            onPick={(t) => send(t, { topicId: activeSession?.topicId ?? null })}
          />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-7">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {!isStreaming && followUps.length > 0 && (
              <FollowUpChips chips={followUps} onPick={(t) => send(t)} />
            )}

            {canRegenerate && (
              <div className="-mt-3 flex justify-start pl-11">
                <Button variant="ghost" size="sm" onClick={() => regenerate()} className="min-h-[44px]">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mx-auto mt-4 max-w-3xl rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-1.5 text-sm font-medium text-destructive-text"
          >
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="focus-ring min-h-[44px] shrink-0 rounded-lg px-2 text-sm font-semibold hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <ChatInput
        onSend={(t) => send(t, { topicId: activeSession?.topicId ?? null })}
        onCancel={cancel}
        isStreaming={isStreaming}
        placeholder={
          activeSession?.topicTitle
            ? `Ask about "${activeSession.topicTitle}"…`
            : "Ask anything tech…"
        }
      />
    </div>
  );
}

function EmptyState({
  title,
  hint,
  compact,
  onPick,
}: {
  title: ReactNode;
  hint: string;
  compact: boolean;
  onPick: (text: string) => void;
}) {
  const reduce = useReducedMotionSafe();
  return (
    <div
      className={cn(
        "mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center text-center",
        compact ? "py-2" : "py-6"
      )}
    >
      <div className="relative">
        {/* The bot stands in its own pool of aurora light. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-1/25 blur-3xl"
        />
        <Mascot size={compact ? 76 : 112} className="relative" />
      </div>
      <h2
        className={cn(
          "mt-5 font-display leading-[1.05] text-foreground [text-wrap:balance]",
          compact ? "text-2xl" : "text-[clamp(2rem,5vw,3rem)]"
        )}
      >
        {title}
      </h2>
      <p className={cn("mt-3 max-w-md leading-relaxed text-muted-foreground", compact ? "text-sm" : "text-[15px]")}>
        {hint}
      </p>

      <div className={cn("mt-8 grid w-full gap-3", !compact && "sm:grid-cols-2")}>
        {STARTERS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.text}
              type="button"
              onClick={() => onPick(s.text)}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.15 + i * 0.06, ease: EASE }}
              style={{ "--spot": s.spot } as CSSProperties}
              className="card-chunky spotlight card-press focus-ring group flex min-h-[64px] items-center gap-3 px-4 py-3.5 text-left"
            >
              <span aria-hidden className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1", s.well)}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">{s.text}</span>
              <ArrowUpRight
                aria-hidden
                className="h-4 w-4 shrink-0 text-muted-foreground transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:transition-none"
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
