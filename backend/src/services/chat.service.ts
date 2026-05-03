import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { complete, streamComplete, ChatTurn } from "./llm.service";
import {
  buildSystemPrompt,
  SkillLevel,
  SystemPromptContext,
} from "../prompts/system.prompt";
import { classifyIntent, Intent } from "../prompts/intent.prompt";
import { intentInstructions, FOLLOWUPS_SYSTEM } from "../prompts/intent-instructions";
import { log } from "../utils/logger.util";

const HISTORY_TURNS_FOR_LLM = 10; // last N messages sent to the model

function priorLevelToSkillLevel(priorLevel: string | undefined | null): SkillLevel {
  if (priorLevel === "experienced") return "advanced";
  if (priorLevel === "some") return "intermediate";
  return "beginner";
}

function truncateTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > 60 ? cleaned.slice(0, 57) + "..." : cleaned;
}

async function loadSessionContext(sessionId: string, userId: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      topic: {
        select: {
          id: true,
          title: true,
          summary: true,
          phase: true,
          roadmap: { select: { domain: { select: { name: true, slug: true } } } },
        },
      },
    },
  });
  if (!session) throw new ApiError(404, "Chat session not found");
  if (session.userId !== userId) throw new ApiError(403, "Not your session");
  return session;
}

async function buildPromptContext(
  userId: string,
  topic: NonNullable<Awaited<ReturnType<typeof loadSessionContext>>["topic"]> | null
): Promise<SystemPromptContext> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { priorLevel: true },
  });
  return {
    level: priorLevelToSkillLevel(profile?.priorLevel),
    topic: topic
      ? { title: topic.title, summary: topic.summary, phase: topic.phase }
      : null,
    domain: topic?.roadmap?.domain ? topic.roadmap.domain : null,
  };
}

export async function createSession(opts: {
  userId: string;
  topicId?: string | null;
  title?: string;
}) {
  if (opts.topicId) {
    const topic = await prisma.topic.findUnique({
      where: { id: opts.topicId },
      select: { id: true, title: true },
    });
    if (!topic) throw new ApiError(404, "Topic not found");
  }

  const session = await prisma.chatSession.create({
    data: {
      userId: opts.userId,
      topicId: opts.topicId ?? null,
      title: opts.title?.trim() || "New chat",
    },
    select: {
      id: true,
      title: true,
      topicId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return session;
}

export async function listSessions(userId: string) {
  const sessions = await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      topicId: true,
      createdAt: true,
      updatedAt: true,
      topic: { select: { title: true } },
      _count: { select: { messages: true } },
    },
  });
  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    topicId: s.topicId,
    topicTitle: s.topic?.title ?? null,
    messageCount: s._count.messages,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
}

export async function getSession(sessionId: string, userId: string) {
  const session = await loadSessionContext(sessionId, userId);
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      intent: true,
      createdAt: true,
    },
  });
  return {
    id: session.id,
    title: session.title,
    topicId: session.topicId,
    topicTitle: session.topic?.title ?? null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messages,
  };
}

export async function renameSession(sessionId: string, userId: string, title: string) {
  await loadSessionContext(sessionId, userId);
  const trimmed = title.trim();
  if (!trimmed) throw new ApiError(400, "Title cannot be empty");
  return prisma.chatSession.update({
    where: { id: sessionId },
    data: { title: trimmed.slice(0, 120) },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function deleteSession(sessionId: string, userId: string) {
  await loadSessionContext(sessionId, userId);
  await prisma.chatSession.delete({ where: { id: sessionId } });
}

/**
 * Stream an assistant response. Yields:
 *   { type: "intent", intent }
 *   { type: "delta",  text }
 *   { type: "done",   message: persistedAssistantMessage, followUps: string[] }
 *
 * Persists user + assistant rows. Caller (controller) writes SSE frames.
 */
export async function* streamMessage(opts: {
  sessionId: string;
  userId: string;
  userMessage: string;
  regenerate?: boolean; // true → don't persist a new user row, re-stream off the last user msg
}): AsyncGenerator<
  | { type: "intent"; intent: Intent }
  | { type: "delta"; text: string }
  | { type: "done"; messageId: string; followUps: string[] }
> {
  const session = await loadSessionContext(opts.sessionId, opts.userId);

  // Persist user message first (unless regenerating off the existing last user msg).
  if (!opts.regenerate) {
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: opts.userMessage,
      },
    });

    // Auto-name the session from the first user message.
    if (session.title === "New chat") {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { title: truncateTitle(opts.userMessage) },
      });
    }
  } else {
    // Drop the prior assistant turn so the regenerated one replaces it.
    const lastAssistant = await prisma.chatMessage.findFirst({
      where: { sessionId: session.id, role: "assistant" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (lastAssistant) {
      await prisma.chatMessage.delete({ where: { id: lastAssistant.id } });
    }
  }

  const intent = await classifyIntent(opts.userMessage);
  yield { type: "intent", intent };

  const ctx = await buildPromptContext(opts.userId, session.topic);
  const systemPrompt = buildSystemPrompt(ctx) + intentInstructions(intent);

  // Build short rolling history (excluding the just-persisted user message and
  // the current user message — those are passed separately).
  const recent = await prisma.chatMessage.findMany({
    where: { sessionId: session.id, role: { in: ["user", "assistant"] } },
    orderBy: { createdAt: "desc" },
    take: HISTORY_TURNS_FOR_LLM + 1, // +1 because the latest is the current user msg
    select: { role: true, content: true },
  });
  // findMany returned newest-first; reverse and drop the most recent (current user msg).
  const history: ChatTurn[] = recent
    .reverse()
    .slice(0, -1)
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));

  let full = "";
  for await (const chunk of streamComplete({
    systemPrompt,
    history,
    userPrompt: opts.userMessage,
    temperature: intent === "motivational" ? 0.85 : 0.5,
    maxTokens: 800,
  })) {
    full += chunk;
    yield { type: "delta", text: chunk };
  }

  if (!full.trim()) {
    full = "_(No response generated. Try rephrasing your question.)_";
  }

  const saved = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "assistant",
      content: full,
      intent,
    },
    select: { id: true },
  });

  // Bump session updatedAt so sidebar sorts correctly.
  await prisma.chatSession.update({
    where: { id: session.id },
    data: { updatedAt: new Date() },
  });

  // Suggested follow-ups — best-effort, must not break the response.
  let followUps: string[] = [];
  try {
    const raw = await complete({
      systemPrompt: FOLLOWUPS_SYSTEM,
      userPrompt: `Previous assistant response:\n${full.slice(0, 1500)}`,
      temperature: 0.4,
      maxTokens: 120,
    });
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      followUps = parsed.filter((s) => typeof s === "string").slice(0, 3);
    }
  } catch (err) {
    log.warn("follow-up generation failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  yield { type: "done", messageId: saved.id, followUps };
}
