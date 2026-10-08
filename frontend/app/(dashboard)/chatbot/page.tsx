"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { SessionSidebar } from "@/components/chat/SessionSidebar";
import { useChatBootstrap, useStartSession } from "@/hooks/useChat";
import { useChatStore } from "@/store/chatStore";

export default function ChatbotPageWrapper() {
  return (
    <Suspense
      fallback={
        <main className="flex h-[calc(100dvh-4.125rem)] items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
        </main>
      }
    >
      <ChatbotPage />
    </Suspense>
  );
}

function ChatbotPage() {
  useChatBootstrap();
  const search = useSearchParams();
  const router = useRouter();
  const startSession = useStartSession();
  const activeSession = useChatStore((s) => s.activeSession);
  const sessionsLoaded = useChatStore((s) => s.sessionsLoaded);
  const startedRef = useRef(false);

  // If ?topic=<id> is present and we don't have an active session pinned to it,
  // create a new session for that topic. Run once.
  useEffect(() => {
    const topicId = search.get("topic");
    if (!topicId || !sessionsLoaded || startedRef.current) return;
    if (activeSession?.topicId === topicId) {
      startedRef.current = true;
      return;
    }
    startedRef.current = true;
    startSession({ topicId }).then(() => {
      // Strip the param so refreshes don't keep re-creating sessions.
      router.replace("/chatbot");
    });
  }, [search, sessionsLoaded, activeSession?.topicId, startSession, router]);

  return (
    // Height = viewport minus the 4rem navbar (+2px border); on phones also
    // minus the fixed bottom tab bar, so the input never hides beneath it.
    <main className="flex h-[calc(100dvh-8.625rem)] overflow-hidden md:h-[calc(100dvh-4.125rem)]">
      {/* Sidebar hides on mobile so the chat fills the screen.
          Tablet+ shows the sidebar. */}
      <div className="hidden md:block">
        <SessionSidebar />
      </div>
      <div className="relative flex-1 overflow-hidden">
        {/* Ambient light: a faint violet pool high in the conversation pane
            so the empty dark reads as depth, not void. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-80 w-[44rem] max-w-[120%] -translate-x-1/2 rounded-full bg-aurora-1/[0.12] blur-3xl" />
          <div className="grid-faint absolute inset-x-0 top-0 h-96 opacity-60" />
        </div>
        <ChatWindow className="relative" />
      </div>
    </main>
  );
}
