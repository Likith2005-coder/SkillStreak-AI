"use client";

import { useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/playground/Mascot";
import { useChatStore } from "@/store/chatStore";
import { useSendMessage } from "@/hooks/useChat";
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

const STARTERS = [
  "Explain CIA Triad with an analogy",
  "Give me a roadmap for backend dev",
  "Quiz me on REST vs GraphQL",
  "Recommend YouTube videos on linear regression",
];

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
    if (!stickToBottomRef.current) return;
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
        className={cn("flex-1 overflow-y-auto px-4", compact ? "py-4" : "py-6")}
      >
        {messages.length === 0 ? (
          <EmptyState
            title={emptyTitle ?? "Ask anything tech."}
            hint={
              emptyHint ??
              "Explanations, roadmaps, quizzes, debugging — your AI tutor knows your level."
            }
            starters={STARTERS}
            compact={compact}
            onPick={(t) => send(t, { topicId: activeSession?.topicId ?? null })}
          />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {!isStreaming && followUps.length > 0 && (
              <div className="mt-2">
                <FollowUpChips chips={followUps} onPick={(t) => send(t)} />
              </div>
            )}

            {canRegenerate && (
              <div className="flex justify-start pl-12">
                <Button variant="outline" size="sm" onClick={() => regenerate()}>
                  <RefreshCw className="h-4 w-4" strokeWidth={3} />
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mx-auto mt-4 max-w-3xl rounded-2xl border-2 border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive-text">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="focus-ring min-h-[44px] shrink-0 rounded-lg px-2 text-sm font-extrabold hover:underline"
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
  starters,
  compact,
  onPick,
}: {
  title: string;
  hint: string;
  starters: string[];
  compact: boolean;
  onPick: (text: string) => void;
}) {
  return (
    <div className={cn("mx-auto flex max-w-2xl flex-col items-center justify-center text-center", compact ? "py-2" : "py-10")}>
      <Mascot size={compact ? 84 : 120} message={compact ? undefined : "Hi! I'm your tutor. Ask me anything."} />
      <h2 className={cn("mt-4 font-display text-foreground [text-wrap:balance]", compact ? "text-xl" : "text-3xl")}>{title}</h2>
      <p className="mt-2 max-w-md text-sm font-semibold text-muted-foreground">{hint}</p>

      <div className={cn("mt-6 grid w-full gap-2.5", !compact && "sm:grid-cols-2")}>
        {starters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="card-press focus-ring min-h-[52px] rounded-2xl border-2 border-b-4 border-border bg-card px-4 py-3 text-left text-sm font-bold text-foreground transition-colors hover:border-secondary-bright hover:bg-secondary/5"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
