/**
 * Phase 8 — Admin service.
 *
 * Topic CRUD (edit + delete; create lands inside the seed script for now)
 * plus a metrics dashboard query for the /admin page.
 */

import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";

// ─── Topics ─────────────────────────────────────────────────

export type TopicUpdate = {
  title?: string;
  summary?: string;
  difficulty?: "easy" | "standard" | "hard";
  phase?: "foundations" | "core" | "advanced";
};

export async function listTopicsForAdmin() {
  const topics = await prisma.topic.findMany({
    orderBy: [
      { roadmap: { domain: { orderIndex: "asc" } } },
      { orderIndex: "asc" },
    ],
    select: {
      id: true,
      title: true,
      summary: true,
      difficulty: true,
      phase: true,
      orderIndex: true,
      roadmap: {
        select: {
          domain: { select: { slug: true, name: true, color: true } },
        },
      },
      _count: { select: { progress: true, quizAttempts: true } },
    },
  });
  return topics.map((t) => ({
    id: t.id,
    title: t.title,
    summary: t.summary,
    difficulty: t.difficulty,
    phase: t.phase,
    orderIndex: t.orderIndex,
    domain: t.roadmap.domain,
    completedBy: t._count.progress,
    quizAttempts: t._count.quizAttempts,
  }));
}

export async function updateTopic(id: string, input: TopicUpdate) {
  const topic = await prisma.topic.findUnique({ where: { id } });
  if (!topic) throw new ApiError(404, "Topic not found");

  const updated = await prisma.topic.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.summary !== undefined && { summary: input.summary.trim() }),
      ...(input.difficulty !== undefined && { difficulty: input.difficulty }),
      ...(input.phase !== undefined && { phase: input.phase }),
    },
    select: { id: true, title: true, summary: true, difficulty: true, phase: true },
  });
  return updated;
}

export async function deleteTopic(id: string) {
  const topic = await prisma.topic.findUnique({ where: { id } });
  if (!topic) throw new ApiError(404, "Topic not found");
  await prisma.topic.delete({ where: { id } });
}

// ─── Metrics ────────────────────────────────────────────────

export async function getMetrics() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers24h,
    newUsers30d,
    totalCompletions,
    completions24h,
    totalQuizAttempts,
    quizAttempts24h,
    activeUsers24h,
    activeUsers30d,
    popularTopicsRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.userProgress.count({ where: { status: "completed" } }),
    prisma.userProgress.count({
      where: { status: "completed", completedAt: { gte: dayAgo } },
    }),
    prisma.quizAttempt.count(),
    prisma.quizAttempt.count({ where: { attemptedAt: { gte: dayAgo } } }),
    prisma.xpEvent
      .findMany({
        where: { createdAt: { gte: dayAgo } },
        select: { userId: true },
        distinct: ["userId"],
      })
      .then((rows) => rows.length),
    prisma.xpEvent
      .findMany({
        where: { createdAt: { gte: monthAgo } },
        select: { userId: true },
        distinct: ["userId"],
      })
      .then((rows) => rows.length),
    prisma.userProgress.groupBy({
      by: ["topicId"],
      where: { status: "completed" },
      _count: { topicId: true },
      orderBy: { _count: { topicId: "desc" } },
      take: 5,
    }),
  ]);

  const popularTopics = await prisma.topic.findMany({
    where: { id: { in: popularTopicsRaw.map((p) => p.topicId) } },
    select: {
      id: true,
      title: true,
      roadmap: { select: { domain: { select: { name: true, color: true } } } },
    },
  });
  const popularMap = new Map(popularTopics.map((t) => [t.id, t]));
  const popular = popularTopicsRaw
    .map((p) => {
      const t = popularMap.get(p.topicId);
      if (!t) return null;
      return {
        topicId: t.id,
        title: t.title,
        domain: t.roadmap.domain,
        completions: p._count.topicId,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    users: {
      total: totalUsers,
      newLast24h: newUsers24h,
      newLast30d: newUsers30d,
      activeLast24h: activeUsers24h,
      activeLast30d: activeUsers30d,
    },
    learning: {
      topicsCompleted: totalCompletions,
      topicsCompletedLast24h: completions24h,
      quizAttempts: totalQuizAttempts,
      quizAttemptsLast24h: quizAttempts24h,
    },
    popular,
  };
}
