import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { complete } from "./llm.service";
import { remember } from "./cache.service";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

const TOPIC_PUBLIC = {
  id: true,
  orderIndex: true,
  title: true,
  summary: true,
  difficulty: true,
  phase: true,
  roadmap: {
    select: {
      id: true,
      title: true,
      domain: {
        select: { id: true, slug: true, name: true, color: true, icon: true },
      },
    },
  },
} as const;

// Per planning doc §9.5: cache common explanations 30 days.
const EXPLANATION_TTL_SECONDS = 30 * 24 * 60 * 60;

const SYSTEM_PROMPT = `You are SkillStreak AI, a focused and friendly tech tutor.

BEHAVIOR:
- Adapt explanations to the learner's skill level.
- Use plain language. Avoid jargon unless the learner is advanced.
- Structure: 1-line definition → 3 key points → 1 real-world example → 1 common misconception.
- Length: 150-250 words.
- Use Markdown: headings (##), bullet points, bold for key terms, fenced code blocks where helpful.
- Be accurate. If a topic has multiple correct framings, pick one and be consistent.`;

function priorLevelToSkillLevel(priorLevel: string | undefined | null): SkillLevel {
  if (priorLevel === "experienced") return "advanced";
  if (priorLevel === "some") return "intermediate";
  return "beginner";
}

export async function getTopicForUser(topicId: string, userId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: TOPIC_PUBLIC,
  });
  if (!topic) throw new ApiError(404, "Topic not found");

  const progress = await prisma.userProgress.findUnique({
    where: { userId_topicId: { userId, topicId } },
    select: {
      status: true,
      bestScore: true,
      completedAt: true,
      timeSpentSeconds: true,
    },
  });

  return { ...topic, progress };
}

export async function explainTopic(
  topicId: string,
  userId: string
): Promise<{ explanation: string; level: SkillLevel; cached: boolean }> {
  const [topic, profile] = await Promise.all([
    prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, title: true, summary: true, phase: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: { priorLevel: true },
    }),
  ]);

  if (!topic) throw new ApiError(404, "Topic not found");
  const level = priorLevelToSkillLevel(profile?.priorLevel);

  const cacheKey = `topic:${topic.id}:level:${level}`;
  const userPrompt = `Explain "${topic.title}" to a ${level} learner.

Topic summary (for context, do not repeat verbatim): ${topic.summary}

Curriculum phase: ${topic.phase}.`;

  const { value, cached } = await remember<{ explanation: string }>(
    cacheKey,
    EXPLANATION_TTL_SECONDS,
    async () => {
      const text = await complete({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.5,
        maxTokens: 800,
      });
      return { explanation: text };
    }
  );

  return { explanation: value.explanation, level, cached };
}

export async function markTopicComplete(topicId: string, userId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true },
  });
  if (!topic) throw new ApiError(404, "Topic not found");

  const progress = await prisma.userProgress.upsert({
    where: { userId_topicId: { userId, topicId } },
    create: {
      userId,
      topicId,
      status: "completed",
      completedAt: new Date(),
    },
    update: {
      status: "completed",
      completedAt: new Date(),
    },
    select: {
      status: true,
      completedAt: true,
      bestScore: true,
      timeSpentSeconds: true,
    },
  });

  return progress;
}
