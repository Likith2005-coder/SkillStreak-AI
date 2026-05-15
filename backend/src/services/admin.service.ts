/**
 * Phase 8 — Admin service.
 *
 * Topic CRUD + listing with filters, user management (list / update role /
 * delete / reset progress / grant XP), and a metrics dashboard query.
 * Interview-prep cache busting also lives here so the admin UI can hit
 * "regenerate" per domain.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { del as cacheDel } from "./cache.service";

// ─── Topics ─────────────────────────────────────────────────

export type TopicUpdate = {
  title?: string;
  summary?: string;
  difficulty?: "easy" | "standard" | "hard";
  phase?: "foundations" | "core" | "advanced";
};

/**
 * List topics with optional filters. Use `domainSlug` for the main UX
 * (admin picks a domain, gets that domain's topics only). `phase` and
 * `search` further narrow within a domain.
 */
export async function listTopicsForAdmin(opts?: {
  domainSlug?: string;
  phase?: "foundations" | "core" | "advanced";
  search?: string;
}) {
  const where: Prisma.TopicWhereInput = {};
  if (opts?.domainSlug) {
    where.roadmap = { domain: { slug: opts.domainSlug } };
  }
  if (opts?.phase) {
    where.phase = opts.phase;
  }
  if (opts?.search && opts.search.trim()) {
    const q = opts.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }

  const topics = await prisma.topic.findMany({
    where,
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
          id: true,
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
    roadmapId: t.roadmap.id,
    domain: t.roadmap.domain,
    completedBy: t._count.progress,
    quizAttempts: t._count.quizAttempts,
  }));
}

export type TopicCreate = {
  domainSlug: string;
  title: string;
  summary: string;
  difficulty: "easy" | "standard" | "hard";
  phase: "foundations" | "core" | "advanced";
};

export async function createTopic(input: TopicCreate) {
  const domain = await prisma.domain.findUnique({
    where: { slug: input.domainSlug },
    select: {
      id: true,
      roadmap: {
        select: {
          id: true,
          totalTopics: true,
          topics: { select: { orderIndex: true }, orderBy: { orderIndex: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!domain) throw new ApiError(404, "Domain not found");
  if (!domain.roadmap) {
    throw new ApiError(409, "This domain has no curated roadmap to add topics to");
  }

  const nextOrder = (domain.roadmap.topics[0]?.orderIndex ?? -1) + 1;

  const created = await prisma.topic.create({
    data: {
      roadmapId: domain.roadmap.id,
      title: input.title.trim(),
      summary: input.summary.trim(),
      difficulty: input.difficulty,
      phase: input.phase,
      orderIndex: nextOrder,
    },
    select: { id: true, title: true, summary: true, difficulty: true, phase: true, orderIndex: true },
  });

  // Keep `totalTopics` on the roadmap in sync — the dashboard reads from it.
  await prisma.roadmap.update({
    where: { id: domain.roadmap.id },
    data: { totalTopics: { increment: 1 } },
  });

  return created;
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
  const topic = await prisma.topic.findUnique({
    where: { id },
    select: { id: true, roadmapId: true },
  });
  if (!topic) throw new ApiError(404, "Topic not found");
  await prisma.topic.delete({ where: { id } });
  await prisma.roadmap.update({
    where: { id: topic.roadmapId },
    data: { totalTopics: { decrement: 1 } },
  });
}

// ─── Users ──────────────────────────────────────────────────

export type UserListItem = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  level: number;
  xp: number;
  createdAt: Date;
  topicsCompleted: number;
  quizAttempts: number;
  currentStreak: number;
  longestStreak: number;
};

export async function listUsers(): Promise<UserListItem[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      level: true,
      xp: true,
      createdAt: true,
      streak: { select: { currentStreak: true, longestStreak: true } },
      _count: { select: { progress: true, quizAttempts: true } },
    },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role === "admin" ? "admin" : "user",
    level: u.level,
    xp: u.xp,
    createdAt: u.createdAt,
    topicsCompleted: u._count.progress,
    quizAttempts: u._count.quizAttempts,
    currentStreak: u.streak?.currentStreak ?? 0,
    longestStreak: u.streak?.longestStreak ?? 0,
  }));
}

export type UserUpdate = {
  role?: "user" | "admin";
  name?: string;
};

export async function updateUser(id: string, input: UserUpdate, actingUserId: string) {
  if (id === actingUserId && input.role === "user") {
    throw new ApiError(409, "You can't demote yourself");
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "User not found");

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(input.role !== undefined && { role: input.role }),
      ...(input.name !== undefined && { name: input.name.trim() }),
    },
    select: { id: true, email: true, name: true, role: true, level: true, xp: true },
  });
  return updated;
}

export async function deleteUser(id: string, actingUserId: string) {
  if (id === actingUserId) {
    throw new ApiError(409, "You can't delete your own account from the admin panel");
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "User not found");
  // Cascade is set on the Prisma schema for the user's owned rows; this single
  // call removes their progress, attempts, sessions, streak, badges, xp events.
  await prisma.user.delete({ where: { id } });
}

export async function resetUserProgress(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "User not found");
  // Wipe progress + quiz attempts + xp events. Streak gets zeroed but kept.
  await prisma.$transaction([
    prisma.userProgress.deleteMany({ where: { userId: id } }),
    prisma.quizAttempt.deleteMany({ where: { userId: id } }),
    prisma.xpEvent.deleteMany({ where: { userId: id } }),
    prisma.userBadge.deleteMany({ where: { userId: id } }),
    prisma.streak.updateMany({
      where: { userId: id },
      data: { currentStreak: 0, longestStreak: 0, lastActiveDate: null },
    }),
    prisma.user.update({
      where: { id },
      data: { xp: 0, level: 1 },
    }),
  ]);
}

// ─── Interview prep cache busting ───────────────────────────

/**
 * Wipe cached interview prep for a domain across all levels so the next
 * request regenerates fresh. Used when admins update the underlying
 * curriculum or just want a different angle.
 */
export async function clearInterviewCache(domainSlug: string) {
  const domain = await prisma.domain.findUnique({
    where: { slug: domainSlug },
    select: { id: true },
  });
  if (!domain) throw new ApiError(404, "Domain not found");
  await Promise.all([
    cacheDel(`interview:${domain.id}:level:beginner:v1`),
    cacheDel(`interview:${domain.id}:level:intermediate:v1`),
    cacheDel(`interview:${domain.id}:level:advanced:v1`),
  ]);
  return { cleared: true };
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
