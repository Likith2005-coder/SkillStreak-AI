"use client";

import { create } from "zustand";
import type {
  ChatMessage,
  ChatSessionDetail,
  ChatSessionSummary,
  Intent,
} from "@/lib/api";

type LocalAssistantMessage = ChatMessage & { streaming?: boolean };

type ChatState = {
  sessions: ChatSessionSummary[];
  sessionsLoaded: boolean;
  activeSessionId: string | null;
  activeSession: ChatSessionDetail | null;
  messages: LocalAssistantMessage[];
  followUps: string[];
  isStreaming: boolean;
  error: string | null;

  setSessions: (sessions: ChatSessionSummary[]) => void;
  upsertSession: (session: ChatSessionSummary) => void;
  removeSession: (id: string) => void;

  loadSession: (session: ChatSessionDetail) => void;
  clearActiveSession: () => void;

  appendUserMessage: (text: string) => void;
  beginStream: (intent?: Intent | null) => void;
  appendDelta: (text: string) => void;
  finalizeAssistant: (info: { messageId: string; followUps: string[] }) => void;
  rollbackLastAssistant: () => void;

  setError: (msg: string | null) => void;
  setFollowUps: (chips: string[]) => void;
};

const TEMP_USER_PREFIX = "tmp-user-";
const TEMP_ASSISTANT_ID = "tmp-assistant";

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  sessionsLoaded: false,
  activeSessionId: null,
  activeSession: null,
  messages: [],
  followUps: [],
  isStreaming: false,
  error: null,

  setSessions: (sessions) => set({ sessions, sessionsLoaded: true }),

  upsertSession: (session) =>
    set((s) => {
      const next = s.sessions.filter((x) => x.id !== session.id);
      next.unshift(session);
      return { sessions: next };
    }),

  removeSession: (id) =>
    set((s) => {
      const next = s.sessions.filter((x) => x.id !== id);
      const isActive = s.activeSessionId === id;
      return {
        sessions: next,
        ...(isActive && {
          activeSessionId: null,
          activeSession: null,
          messages: [],
          followUps: [],
        }),
      };
    }),

  loadSession: (session) =>
    set({
      activeSessionId: session.id,
      activeSession: session,
      messages: session.messages,
      followUps: [],
      error: null,
      isStreaming: false,
    }),

  clearActiveSession: () =>
    set({
      activeSessionId: null,
      activeSession: null,
      messages: [],
      followUps: [],
      error: null,
      isStreaming: false,
    }),

  appendUserMessage: (text) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: `${TEMP_USER_PREFIX}${Date.now()}`,
          role: "user",
          content: text,
          intent: null,
          createdAt: new Date().toISOString(),
        },
      ],
      followUps: [],
      error: null,
    })),

  beginStream: (intent) =>
    set((s) => ({
      isStreaming: true,
      messages: [
        ...s.messages,
        {
          id: TEMP_ASSISTANT_ID,
          role: "assistant",
          content: "",
          intent: intent ?? null,
          createdAt: new Date().toISOString(),
          streaming: true,
        },
      ],
    })),

  appendDelta: (text) =>
    set((s) => {
      const idx = s.messages.findIndex((m) => m.id === TEMP_ASSISTANT_ID);
      if (idx === -1) return {};
      const next = s.messages.slice();
      next[idx] = { ...next[idx], content: next[idx].content + text };
      return { messages: next };
    }),

  finalizeAssistant: ({ messageId, followUps }) =>
    set((s) => {
      const idx = s.messages.findIndex((m) => m.id === TEMP_ASSISTANT_ID);
      if (idx === -1) return { followUps, isStreaming: false };
      const next = s.messages.slice();
      next[idx] = { ...next[idx], id: messageId, streaming: false };
      return { messages: next, followUps, isStreaming: false };
    }),

  rollbackLastAssistant: () =>
    set((s) => {
      const idx = s.messages.findIndex((m) => m.id === TEMP_ASSISTANT_ID);
      if (idx === -1) return { isStreaming: false };
      const next = s.messages.slice();
      next.splice(idx, 1);
      return { messages: next, isStreaming: false };
    }),

  setError: (msg) => set({ error: msg }),
  setFollowUps: (chips) => set({ followUps: chips }),
}));

export function selectActiveTopicId(): string | null {
  const s = useChatStore.getState();
  return s.activeSession?.topicId ?? null;
}
