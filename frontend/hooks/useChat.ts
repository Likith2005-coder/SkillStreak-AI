"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
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
  const renameSessionLocal = useChatStore((s) => s.renameSessionLocal);
  const setError = useChatStore((s) => s.setError);
  return useCallback(
    async (id: string, title: string) => {
      const next = title.trim();
      const prev = useChatStore.getState().sessions.find((s) => s.id === id)?.title;
      if (!next || next === prev) return; // nothing to do

      // Optimistic: show the new title instantly.
      renameSessionLocal(id, next);
      try {
        const session = await renameChatSession(id, next);
        // Reconcile with the server's canonical (possibly normalized) title.
        renameSessionLocal(id, session.title);
      } catch (err) {
        // Roll back to the previous title so the user isn't misled.
        if (prev !== undefined) renameSessionLocal(id, prev);
        const msg = apiErrorMessage(err, "Couldn't rename");
        setError(msg);
        toast.error("Rename failed", { description: `${msg} — reverted.` });
      }
    },
    [renameSessionLocal, setError]
  );
}

export function useDeleteSession() {
  const removeSession = useChatStore((s) => s.removeSession);
  const insertSession = useChatStore((s) => s.insertSession);
  const loadSession = useChatStore((s) => s.loadSession);
  const setError = useChatStore((s) => s.setError);
  return useCallback(
    async (id: string) => {
      const state = useChatStore.getState();
      const index = state.sessions.findIndex((s) => s.id === id);
      if (index === -1) return;
      const removed = state.sessions[index];
      const wasActive = state.activeSessionId === id;
      const activeDetail = wasActive ? state.activeSession : null;

      // Optimistic: drop it from the list immediately (also clears the pane if active).
      removeSession(id);
      try {
        await deleteChatSession(id);
      } catch (err) {
        // Roll back: restore the row at its original spot (and the open pane if
        // it was the active conversation) so nothing is silently lost.
        insertSession(removed, index);
        if (activeDetail) loadSession(activeDetail);
        const msg = apiErrorMessage(err, "Couldn't delete");
        setError(msg);
        toast.error("Delete failed", { description: `${msg} — conversation restored.` });
      }
    },
    [insertSession, loadSession, removeSession, setError]
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
