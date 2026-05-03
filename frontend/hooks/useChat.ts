"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  apiErrorMessage,
  createChatSession,
  deleteChatSession,
  getChatSession,
  listChatSessions,
  renameChatSession,
  streamChatMessage,
} from "@/lib/api";
import { useChatStore } from "@/store/chatStore";

export function useChatBootstrap() {
  const setSessions = useChatStore((s) => s.setSessions);
  const sessionsLoaded = useChatStore((s) => s.sessionsLoaded);

  useEffect(() => {
    if (sessionsLoaded) return;
    listChatSessions()
      .then(setSessions)
      .catch(() => setSessions([]));
  }, [setSessions, sessionsLoaded]);
}

export function useOpenSession() {
  const loadSession = useChatStore((s) => s.loadSession);
  const setError = useChatStore((s) => s.setError);

  return useCallback(
    async (sessionId: string) => {
      try {
        const detail = await getChatSession(sessionId);
        loadSession(detail);
      } catch (err) {
        setError(apiErrorMessage(err, "Couldn't load that conversation"));
      }
    },
    [loadSession, setError]
  );
}

export function useStartSession() {
  const upsertSession = useChatStore((s) => s.upsertSession);
  const loadSession = useChatStore((s) => s.loadSession);
  const setError = useChatStore((s) => s.setError);

  return useCallback(
    async (opts?: { topicId?: string | null; title?: string }) => {
      try {
        const session = await createChatSession(opts ?? {});
        upsertSession(session);
        loadSession({
          id: session.id,
          title: session.title,
          topicId: session.topicId,
          topicTitle: session.topicTitle,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messages: [],
        });
        return session;
      } catch (err) {
        setError(apiErrorMessage(err, "Couldn't start a new conversation"));
        return null;
      }
    },
    [loadSession, setError, upsertSession]
  );
}

export function useRenameSession() {
  const upsertSession = useChatStore((s) => s.upsertSession);
  const setError = useChatStore((s) => s.setError);
  return useCallback(
    async (id: string, title: string) => {
      try {
        const session = await renameChatSession(id, title);
        upsertSession({
          ...session,
          topicId: useChatStore.getState().sessions.find((s) => s.id === id)?.topicId ?? null,
          topicTitle:
            useChatStore.getState().sessions.find((s) => s.id === id)?.topicTitle ?? null,
          messageCount:
            useChatStore.getState().sessions.find((s) => s.id === id)?.messageCount ?? 0,
          createdAt:
            useChatStore.getState().sessions.find((s) => s.id === id)?.createdAt ?? session.updatedAt,
        });
      } catch (err) {
        setError(apiErrorMessage(err, "Couldn't rename"));
      }
    },
    [setError, upsertSession]
  );
}

export function useDeleteSession() {
  const removeSession = useChatStore((s) => s.removeSession);
  const setError = useChatStore((s) => s.setError);
  return useCallback(
    async (id: string) => {
      try {
        await deleteChatSession(id);
        removeSession(id);
      } catch (err) {
        setError(apiErrorMessage(err, "Couldn't delete"));
      }
    },
    [removeSession, setError]
  );
}

/**
 * Send a message. If no active session exists, creates one (optionally pinned to a topic).
 * Returns the session id used (so callers can navigate to /chatbot?session=id).
 */
export function useSendMessage() {
  const startSession = useStartSession();
  const appendUserMessage = useChatStore((s) => s.appendUserMessage);
  const beginStream = useChatStore((s) => s.beginStream);
  const appendDelta = useChatStore((s) => s.appendDelta);
  const finalizeAssistant = useChatStore((s) => s.finalizeAssistant);
  const rollbackLastAssistant = useChatStore((s) => s.rollbackLastAssistant);
  const setError = useChatStore((s) => s.setError);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const send = useCallback(
    async (text: string, opts?: { topicId?: string | null; regenerate?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed) return null;

      let sessionId = useChatStore.getState().activeSessionId;
      if (!sessionId) {
        const created = await startSession({ topicId: opts?.topicId ?? null });
        if (!created) return null;
        sessionId = created.id;
      }

      const isRegen = opts?.regenerate === true;
      if (!isRegen) appendUserMessage(trimmed);
      beginStream();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamChatMessage(
          sessionId,
          trimmed,
          {
            onDelta: (chunk) => appendDelta(chunk),
            onDone: ({ messageId, followUps }) => finalizeAssistant({ messageId, followUps }),
            onError: ({ error }) => {
              setError(error);
              rollbackLastAssistant();
            },
          },
          { regenerate: isRegen, signal: controller.signal }
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          rollbackLastAssistant();
        } else {
          setError(apiErrorMessage(err, "Streaming failed"));
          rollbackLastAssistant();
        }
      } finally {
        abortRef.current = null;
      }

      return sessionId;
    },
    [
      appendDelta,
      appendUserMessage,
      beginStream,
      finalizeAssistant,
      rollbackLastAssistant,
      setError,
      startSession,
    ]
  );

  const regenerate = useCallback(async () => {
    const msgs = useChatStore.getState().messages;
    // Find the last user message; re-stream off it.
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "user") {
        return send(msgs[i].content, { regenerate: true });
      }
    }
    return null;
  }, [send]);

  return { send, regenerate, cancel };
}
