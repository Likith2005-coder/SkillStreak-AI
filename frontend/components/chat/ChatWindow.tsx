"use client";

import { useEffect, useRef } from "react";
import { Bot, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
};

const STARTERS = [
  "Explain CIA Triad with an analogy",
  "Give me a roadmap for backend dev",
  "Quiz me on REST vs GraphQL",
  "Recommend YouTube videos on linear regression",
];

export function ChatWindow({ emptyTitle, emptyHint, className }: Props) {
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
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        {messages.length === 0 ? (
          <EmptyState
            title={emptyTitle ?? "Ask anything tech."}
            hint={
              emptyHint ??
              "Explanations, roadmaps, quizzes, debugging — your AI tutor knows your level."
            }
            starters={STARTERS}
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
              <div className="flex justify-start pl-10">
                <Button variant="ghost" size="sm" onClick={() => regenerate()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mx-auto mt-4 max-w-3xl rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs uppercase tracking-wider opacity-70 hover:opacity-100"
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
  onPick,
}: {
  title: string;
  hint: string;
  starters: string[];
  onPick: (text: string) => void;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
        <Bot className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>

      <div className="mt-6 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        Try a starter
      </div>
      <div className="mt-3 grid w-full gap-2 sm:grid-cols-2">
        {starters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-xl border border-border bg-card/40 p-3 text-left text-sm transition hover:border-primary/40 hover:bg-card/70"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
