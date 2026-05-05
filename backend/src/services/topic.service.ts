import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { complete } from "./llm.service";
import { remember } from "./cache.service";
import { recordTopicComplete, type GamificationDelta } from "./gamification.service";

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

const SYSTEM_PROMPT = `You are SkillStreak AI, a focused and friendly tech tutor writing a substantial explainer article on one topic.

VOICE
- Adapt depth to the learner's skill level: beginners get plain language and concrete analogies; intermediate gets structure and tradeoffs; advanced gets nuance, edge cases, and named techniques.
- Be precise. Pick one correct framing and stay consistent.
- Active voice, second person ("you"). No hedging filler ("essentially", "basically").

STRUCTURE — output Markdown in this order:

## What it is
A 2–3 sentence definition that a fellow engineer would accept. End with one sentence on *why it matters in practice*.

## How it works
4–7 short paragraphs OR a clear bullet sequence walking through the mechanism step by step. Where it helps, include a fenced code block (\`\`\`lang …\`\`\`) showing the smallest concrete example that demonstrates the concept. If the topic is conceptual rather than coded, use a structured pseudocode block, a small diagram in ASCII, or a worked numerical example instead.

## A real-world example
One concrete scenario from a real product or tool the learner has heard of. Explain the *decision* the engineer made and *why* this concept was the right tool. 4–6 sentences.

## Common pitfalls
3–5 bullet points. Each bullet names a specific mistake learners make and the correction. Phrase positively ("Do X" not just "don't do Y").

## When NOT to use this
2–4 sentences on the limits of the technique — situations where it's the wrong choice, and what you'd reach for instead.

## Key takeaways
Exactly 4 short bullets, each one sentence, that a learner could repeat back from memory.

LENGTH & STYLE
- 600–1000 words total. Don't pad — if a section can be tighter without losing meaning, tighten it.
- Use Markdown freely: \`##\` for the section headings above, \`**bold**\` for key terms on first mention, fenced code blocks with language hints, inline \`code\` for identifiers.
- Don't restate the topic title back at the user. Don't end with "I hope this helps".`;

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

  // v2 suffix invalidates the old short-form cache so users see the new long-form content.
  const cacheKey = `topic:${topic.id}:level:${level}:v2`;
  const userPrompt = `Topic: "${topic.title}"
Topic summary (context only — don't quote verbatim): ${topic.summary}
Curriculum phase: ${topic.phase}
Learner level: ${level}

Write the full explainer article following the structure in the system prompt.`;

  const { value, cached } = await remember<{ explanation: string }>(
    cacheKey,
    EXPLANATION_TTL_SECONDS,
    async () => {
      const text = await complete({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.55,
        maxTokens: 2200,
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

  // Was this already completed? If so, skip gamification (no double-award).
  const existing = await prisma.userProgress.findUnique({
    where: { userId_topicId: { userId, topicId } },
    select: { status: true },
  });
  const wasAlreadyComplete = existing?.status === "completed";

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

  const gamification: GamificationDelta | null = wasAlreadyComplete
    ? null
    : await recordTopicComplete(userId, { topicId });

  return { progress, gamification };
}
