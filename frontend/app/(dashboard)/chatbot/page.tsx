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
        <main className="flex h-[calc(100vh-3.5rem)] items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
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
    <main className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Sidebar hides on mobile so the chat fills the screen.
          Tablet+ shows the sidebar. */}
      <div className="hidden md:block">
        <SessionSidebar />
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>
    </main>
  );
}
