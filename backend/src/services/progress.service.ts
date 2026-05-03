import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";

const HEATMAP_DAYS = 90;

function startOfDayUTC(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Top-level dashboard payload.
 * - Totals across all curated domains (only curated domains have topics)
 * - Per-domain progress with topics done / total + average pass score
 * - Weak areas: topics where best score < 60% (score < 3/5)
 * - Recent quiz attempts (last 5)
 * - Recommended next topic: first not-started topic in user's preferred domain,
 *   else first not-started in any curated domain
 */
export async function getOverview(userId: string) {
  const [user, domains, progressRows, recentAttempts, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, level: true, xp: true, createdAt: true },
    }),
    prisma.domain.findMany({
      where: { isCurated: true },
      orderBy: { orderIndex: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        color: true,
        icon: true,
        roadmap: {
          select: {
            totalTopics: true,
            topics: { select: { id: true, orderIndex: true, title: true } },
          },
        },
      },
    }),
    prisma.userProgress.findMany({
      where: { userId },
      select: {
        topicId: true,
        status: true,
        bestScore: true,
        completedAt: true,
      },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { attemptedAt: "desc" },
      take: 5,
      select: {
        id: true,
        topicId: true,
        score: true,
        total: true,
        passed: true,
        attemptedAt: true,
        topic: { select: { title: true, roadmap: { select: { domain: { select: { slug: true, name: true, color: true } } } } } },
      },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: { preferredDomains: true },
    }),
  ]);

  if (!user) throw new ApiError(404, "User not found");

  const progressByTopic = new Map(progressRows.map((p) => [p.topicId, p]));
  const completedTopicIds = new Set(
    progressRows.filter((p) => p.status === "completed").map((p) => p.topicId)
  );

  let totalTopics = 0;
  const perDomain = domains.map((d) => {
    const topics = d.roadmap?.topics ?? [];
    const total = d.roadmap?.totalTopics ?? topics.length;
    totalTopics += total;
    const done = topics.filter((t) => completedTopicIds.has(t.id)).length;
    const scores = topics
      .map((t) => progressByTopic.get(t.id)?.bestScore)
      .filter((s): s is number => typeof s === "number");
    const avgScore = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;
    return {
      slug: d.slug,
      name: d.name,
      color: d.color,
      icon: d.icon,
      done,
      total,
      avgScore,
    };
  });

  const totalCompleted = completedTopicIds.size;

  // Weak areas: progress rows with bestScore < 3 (i.e. < 60%)
  const weakRows = await prisma.userProgress.findMany({
    where: { userId, bestScore: { lt: 3 } },
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: {
      topicId: true,
      bestScore: true,
      topic: {
        select: {
          id: true,
          title: true,
          roadmap: { select: { domain: { select: { slug: true, name: true, color: true } } } },
        },
      },
    },
  });
  const weakAreas = weakRows.map((w) => ({
    topicId: w.topicId,
    title: w.topic.title,
    bestScore: w.bestScore,
    domain: w.topic.roadmap.domain,
  }));

  // Recommended next topic
  const preferredSlugs = profile?.preferredDomains ?? [];
  const candidateDomains = preferredSlugs.length
    ? domains.filter((d) => preferredSlugs.includes(d.slug))
    : domains;
  let recommended: { topicId: string; topicTitle: string; domain: { slug: string; name: string; color: string } } | null = null;
  for (const d of candidateDomains.length ? candidateDomains : domains) {
    const next = (d.roadmap?.topics ?? [])
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .find((t) => !completedTopicIds.has(t.id));
    if (next) {
      recommended = {
        topicId: next.id,
        topicTitle: next.title,
        domain: { slug: d.slug, name: d.name, color: d.color },
      };
      break;
    }
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      level: user.level,
      xp: user.xp,
      memberSince: user.createdAt,
    },
    totals: {
      topicsCompleted: totalCompleted,
      topicsAvailable: totalTopics,
      attempts: recentAttempts.length, // capped to 5; full count optional
    },
    perDomain,
    weakAreas,
    recentAttempts: recentAttempts.map((a) => ({
      id: a.id,
      topicId: a.topicId,
      topicTitle: a.topic.title,
      domain: a.topic.roadmap.domain,
      score: a.score,
      total: a.total,
      passed: a.passed,
      attemptedAt: a.attemptedAt,
    })),
    recommended,
  };
}

/**
 * Per-domain detail: same shape as the roadmap view + an aggregated quiz stats block.
 */
export async function getDomainProgress(slug: string, userId: string) {
  const domain = await prisma.domain.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      color: true,
      icon: true,
      isCurated: true,
      roadmap: {
        select: {
          totalTopics: true,
          topics: {
            orderBy: { orderIndex: "asc" },
            select: { id: true, orderIndex: true, title: true, phase: true },
          },
        },
      },
    },
  });
  if (!domain) throw new ApiError(404, "Domain not found");
  const topics = domain.roadmap?.topics ?? [];

  const [progress, attempts] = await Promise.all([
    prisma.userProgress.findMany({
      where: { userId, topicId: { in: topics.map((t) => t.id) } },
      select: { topicId: true, status: true, bestScore: true, completedAt: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, topicId: { in: topics.map((t) => t.id) } },
      orderBy: { attemptedAt: "asc" },
      select: { topicId: true, score: true, total: true, passed: true, attemptedAt: true },
    }),
  ]);

  const progressMap = new Map(progress.map((p) => [p.topicId, p]));
  const enriched = topics.map((t) => ({
    ...t,
    status: progressMap.get(t.id)?.status ?? "not_started",
    bestScore: progressMap.get(t.id)?.bestScore ?? null,
    completedAt: progressMap.get(t.id)?.completedAt ?? null,
  }));

  const passes = attempts.filter((a) => a.passed).length;
  const avgScore = attempts.length
    ? Math.round((attempts.reduce((s, a) => s + a.score, 0) / attempts.length) * 10) / 10
    : null;

  return {
    domain: { slug: domain.slug, name: domain.name, color: domain.color, icon: domain.icon },
    totals: {
      topicsCompleted: enriched.filter((t) => t.status === "completed").length,
      topicsAvailable: enriched.length,
    },
    quiz: {
      attempts: attempts.length,
      passes,
      avgScore,
      trend: attempts.map((a) => ({
        date: a.attemptedAt.toISOString(),
        score: a.score,
        total: a.total,
      })),
    },
    topics: enriched,
  };
}

/**
 * 90-day heatmap. Counts qualifying activity per day:
 *   - A topic completion (UserProgress.completedAt)
 *   - A quiz attempt (QuizAttempt.attemptedAt)
 *
 * Returns dense array of { date, count }, including zero days.
 */
export async function getHeatmap(userId: string) {
  const today = startOfDayUTC(new Date());
  const earliest = new Date(today);
  earliest.setUTCDate(earliest.getUTCDate() - (HEATMAP_DAYS - 1));

  const [completions, attempts] = await Promise.all([
    prisma.userProgress.findMany({
      where: { userId, completedAt: { gte: earliest } },
      select: { completedAt: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, attemptedAt: { gte: earliest } },
      select: { attemptedAt: true },
    }),
  ]);

  const counts = new Map<string, number>();
  for (const c of completions) {
    if (!c.completedAt) continue;
    const key = isoDate(startOfDayUTC(c.completedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const a of attempts) {
    const key = isoDate(startOfDayUTC(a.attemptedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const days: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < HEATMAP_DAYS; i++) {
    const d = new Date(earliest);
    d.setUTCDate(earliest.getUTCDate() + i);
    const key = isoDate(d);
    days.push({ date: key, count: counts.get(key) ?? 0 });
  }

  const totalActiveDays = days.filter((d) => d.count > 0).length;
  const totalActions = days.reduce((s, d) => s + d.count, 0);

  return { days, totalActiveDays, totalActions };
}
