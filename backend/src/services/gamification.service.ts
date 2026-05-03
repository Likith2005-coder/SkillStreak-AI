/**
 * Phase 6 — Streaks, XP, Levels, Badges, Leaderboard.
 *
 * Design notes:
 * - Streak ticks lazily inside recordActivity(). No cron required: getStreak()
 *   verifies the persisted current_streak is still alive (last_active_date is
 *   today or yesterday) and zeroes it otherwise. Battleplan calls for a
 *   midnight cron — see Phase 8 for the email reminder cron, which can also
 *   invoke a reset sweep if we ever want eager updates.
 * - Freezes: 1 banked at signup, refilled to 1 each Monday (max 2). Spending
 *   a freeze rescues exactly one missed day.
 * - All XP awards are persisted to xp_events so the weekly leaderboard can be
 *   computed by summing xp_events.created_at in the current week.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { log } from "../utils/logger.util";

export type XpReason =
  | "topic_complete"
  | "first_topic_of_day"
  | "quiz_pass"
  | "quiz_perfect"
  | "streak_day"
  | "comeback";

const XP_AMOUNTS: Record<XpReason, number> = {
  topic_complete: 10,
  first_topic_of_day: 10,
  quiz_pass: 15,
  quiz_perfect: 25,
  streak_day: 5,
  comeback: 50,
};

// Per planning doc §17.2: Level N requires 100 * N * log2(N+1) XP cumulative.
function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * level * Math.log2(level + 1));
}

export function levelForXp(xp: number): { level: number; xpIntoLevel: number; xpForNext: number } {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= xp) level++;
  const base = xpRequiredForLevel(level);
  const next = xpRequiredForLevel(level + 1);
  return { level, xpIntoLevel: xp - base, xpForNext: next - base };
}

// ─── Date helpers (UTC days) ─────────────────────────────────

function utcDateOnly(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function daysBetweenUtc(a: Date, b: Date): number {
  return Math.floor((utcDateOnly(b).getTime() - utcDateOnly(a).getTime()) / 86400000);
}

function isMondayUtc(d: Date): boolean {
  return d.getUTCDay() === 1;
}

function startOfIsoWeekUtc(d: Date): Date {
  const x = utcDateOnly(d);
  const dow = x.getUTCDay(); // 0..6 (Sun..Sat)
  const offset = dow === 0 ? -6 : 1 - dow; // Monday = start
  x.setUTCDate(x.getUTCDate() + offset);
  return x;
}

// ─── Badge catalogue ─────────────────────────────────────────

type BadgeCriteria =
  | { type: "topics_completed"; value: number }
  | { type: "streak_days"; value: number }
  | { type: "perfect_quizzes"; value: number }
  | { type: "domains_completed"; value: number }
  | { type: "domains_started"; value: number }
  | { type: "topic_completed_after_midnight" }
  | { type: "topic_completed_before_7am" };

const BADGE_CATALOGUE: Array<{
  slug: string;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria;
}> = [
  {
    slug: "first-step",
    name: "First Step",
    description: "Complete your first topic.",
    icon: "footprints",
    criteria: { type: "topics_completed", value: 1 },
  },
  {
    slug: "week-warrior",
    name: "Week Warrior",
    description: "Hold a 7-day streak.",
    icon: "flame",
    criteria: { type: "streak_days", value: 7 },
  },
  {
    slug: "marathoner",
    name: "Marathoner",
    description: "Hold a 30-day streak.",
    icon: "trophy",
    criteria: { type: "streak_days", value: 30 },
  },
  {
    slug: "quiz-master",
    name: "Quiz Master",
    description: "Score 5/5 on 10 quizzes.",
    icon: "award",
    criteria: { type: "perfect_quizzes", value: 10 },
  },
  {
    slug: "domain-pioneer",
    name: "Domain Pioneer",
    description: "Complete every topic in one domain.",
    icon: "rocket",
    criteria: { type: "domains_completed", value: 1 },
  },
  {
    slug: "polyglot",
    name: "Polyglot",
    description: "Start topics in 5 different domains.",
    icon: "globe-2",
    criteria: { type: "domains_started", value: 5 },
  },
  {
    slug: "insomniac",
    name: "Insomniac",
    description: "Complete a topic between midnight and 4 AM.",
    icon: "moon",
    criteria: { type: "topic_completed_after_midnight" },
  },
  {
    slug: "early-bird",
    name: "Early Bird",
    description: "Complete a topic before 7 AM.",
    icon: "sunrise",
    criteria: { type: "topic_completed_before_7am" },
  },
];

/**
 * Idempotent: ensures all badges from the catalogue exist in the DB.
 * Called lazily on first request that needs badges.
 */
let badgesEnsured = false;
export async function ensureBadgesSeeded(): Promise<void> {
  if (badgesEnsured) return;
  for (let i = 0; i < BADGE_CATALOGUE.length; i++) {
    const b = BADGE_CATALOGUE[i];
    await prisma.badge.upsert({
      where: { slug: b.slug },
      create: {
        slug: b.slug,
        name: b.name,
        description: b.description,
        icon: b.icon,
        criteria: b.criteria as unknown as Prisma.InputJsonValue,
        orderIndex: i,
      },
      update: {
        name: b.name,
        description: b.description,
        icon: b.icon,
        criteria: b.criteria as unknown as Prisma.InputJsonValue,
        orderIndex: i,
      },
    });
  }
  badgesEnsured = true;
}

// ─── XP / level award ─────────────────────────────────────────

export type XpAward = {
  amount: number;
  reason: XpReason;
  meta?: Record<string, unknown>;
};

export async function awardXp(
  userId: string,
  awards: XpAward[]
): Promise<{ totalAwarded: number; newXp: number; oldLevel: number; newLevel: number; events: XpAward[] }> {
  if (awards.length === 0) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true, level: true } });
    return { totalAwarded: 0, newXp: u?.xp ?? 0, oldLevel: u?.level ?? 1, newLevel: u?.level ?? 1, events: [] };
  }

  const total = awards.reduce((s, a) => s + a.amount, 0);

  // Persist xp_events first (also used by leaderboard).
  await prisma.xpEvent.createMany({
    data: awards.map((a) => ({
      userId,
      amount: a.amount,
      reason: a.reason,
      meta: (a.meta ?? null) as Prisma.InputJsonValue,
    })),
  });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: total } },
    select: { xp: true, level: true },
  });

  const newLevel = levelForXp(updated.xp).level;
  let oldLevel = updated.level;
  if (newLevel !== updated.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
    oldLevel = updated.level;
  }

  return { totalAwarded: total, newXp: updated.xp, oldLevel, newLevel, events: awards };
}

// ─── Streak ──────────────────────────────────────────────────

export type StreakUpdate = {
  current: number;
  longest: number;
  freezesAvailable: number;
  changedToday: boolean;       // true on first qualifying action today
  comebackBonus: boolean;      // true when this action is the "first action after a break"
  freezeUsed: boolean;
};

async function getOrCreateStreak(userId: string) {
  const existing = await prisma.streak.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.streak.create({
    data: {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      freezesAvailable: 1,
    },
  });
}

/**
 * Records a qualifying action for the current UTC day.
 * Returns the resulting streak state and whether a comeback bonus is owed.
 */
export async function recordActivity(userId: string): Promise<StreakUpdate> {
  const now = new Date();
  const today = utcDateOnly(now);
  const streak = await getOrCreateStreak(userId);

  // Refill freeze on Mondays (UTC), capped at 2 banked.
  let freezes = streak.freezesAvailable;
  if (isMondayUtc(today) && (!streak.freezesUsedAt || utcDateOnly(streak.freezesUsedAt) < today)) {
    freezes = Math.min(2, freezes + 1);
  }

  if (!streak.lastActiveDate) {
    // First-ever activity.
    const updated = await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        longestStreak: Math.max(1, streak.longestStreak),
        lastActiveDate: today,
        freezesAvailable: freezes,
      },
    });
    return {
      current: updated.currentStreak,
      longest: updated.longestStreak,
      freezesAvailable: updated.freezesAvailable,
      changedToday: true,
      comebackBonus: false,
      freezeUsed: false,
    };
  }

  const lastActive = utcDateOnly(streak.lastActiveDate);
  const gap = daysBetweenUtc(lastActive, today);

  if (gap === 0) {
    // Already counted today — just persist freeze refill if it happened.
    if (freezes !== streak.freezesAvailable) {
      const updated = await prisma.streak.update({
        where: { userId },
        data: { freezesAvailable: freezes },
      });
      return {
        current: updated.currentStreak,
        longest: updated.longestStreak,
        freezesAvailable: updated.freezesAvailable,
        changedToday: false,
        comebackBonus: false,
        freezeUsed: false,
      };
    }
    return {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      freezesAvailable: streak.freezesAvailable,
      changedToday: false,
      comebackBonus: false,
      freezeUsed: false,
    };
  }

  if (gap === 1) {
    // Consecutive day — increment.
    const next = streak.currentStreak + 1;
    const updated = await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: next,
        longestStreak: Math.max(next, streak.longestStreak),
        lastActiveDate: today,
        freezesAvailable: freezes,
      },
    });
    return {
      current: updated.currentStreak,
      longest: updated.longestStreak,
      freezesAvailable: updated.freezesAvailable,
      changedToday: true,
      comebackBonus: false,
      freezeUsed: false,
    };
  }

  // gap >= 2: streak broke unless we can spend exactly enough freezes to fill the holes.
  // Implementation choice: a freeze covers a single missed day. We auto-spend up to
  // (gap - 1) freezes to keep the streak alive; otherwise we reset and award comeback.
  const needed = gap - 1;
  if (freezes >= needed && needed > 0) {
    const next = streak.currentStreak + 1;
    const updated = await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: next,
        longestStreak: Math.max(next, streak.longestStreak),
        lastActiveDate: today,
        freezesAvailable: freezes - needed,
        freezesUsedAt: now,
      },
    });
    return {
      current: updated.currentStreak,
      longest: updated.longestStreak,
      freezesAvailable: updated.freezesAvailable,
      changedToday: true,
      comebackBonus: false,
      freezeUsed: true,
    };
  }

  // Streak broke. Reset to 1; award comeback bonus.
  const updated = await prisma.streak.update({
    where: { userId },
    data: {
      currentStreak: 1,
      // longest unchanged
      lastActiveDate: today,
      freezesAvailable: freezes,
    },
  });
  return {
    current: updated.currentStreak,
    longest: updated.longestStreak,
    freezesAvailable: updated.freezesAvailable,
    changedToday: true,
    comebackBonus: true,
    freezeUsed: false,
  };
}

/**
 * Read the current streak, lazily zeroing it if the user has missed yesterday
 * AND today (i.e. the persisted current_streak is no longer alive).
 */
export async function getStreakSafe(userId: string) {
  const streak = await getOrCreateStreak(userId);
  if (!streak.lastActiveDate || streak.currentStreak === 0) return streak;
  const today = utcDateOnly(new Date());
  const gap = daysBetweenUtc(streak.lastActiveDate, today);
  if (gap >= 2) {
    // Has the user already paid the freeze cost via auto-recover? No — recordActivity
    // hasn't run today yet. So display zero (the actual decrement happens next time
    // they record activity, which is the right place to also decide on comeback).
    return { ...streak, currentStreak: 0 };
  }
  return streak;
}

/**
 * Manually consume a freeze (battleplan §6.3). Lets the user save a streak
 * proactively. We just bump freezesUsedAt; the next missed day will be covered.
 * This is a no-op compared to the auto-spend path but exists for the UI.
 */
export async function spendFreeze(userId: string): Promise<{ remaining: number }> {
  const streak = await getOrCreateStreak(userId);
  if (streak.freezesAvailable <= 0) {
    throw new ApiError(409, "No freezes available");
  }
  const updated = await prisma.streak.update({
    where: { userId },
    data: { freezesAvailable: streak.freezesAvailable - 1, freezesUsedAt: new Date() },
  });
  return { remaining: updated.freezesAvailable };
}

// ─── Badges ──────────────────────────────────────────────────

export type BadgeAward = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
};

/**
 * Evaluate every badge for a user; awards any newly-earned ones.
 * `signal` lets caller hint which signals likely changed (used to short-circuit
 * expensive computations) — unused for now since the queries are cheap at this
 * scale.
 */
export async function evaluateBadges(
  userId: string,
  ctx?: { topicCompletedAt?: Date }
): Promise<BadgeAward[]> {
  await ensureBadgesSeeded();

  const [earnedRows, allBadges, completedCount, streak, perfectCount, perDomain, lastCompletion] =
    await Promise.all([
      prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true },
      }),
      prisma.badge.findMany({ orderBy: { orderIndex: "asc" } }),
      prisma.userProgress.count({
        where: { userId, status: "completed" },
      }),
      prisma.streak.findUnique({ where: { userId } }),
      prisma.quizAttempt.count({
        where: { userId, score: { equals: 5 }, total: 5 },
      }),
      // For domains_completed and domains_started: aggregate per domain.
      prisma.userProgress.findMany({
        where: { userId },
        select: {
          status: true,
          topic: { select: { roadmap: { select: { domainId: true } } } },
        },
      }),
      ctx?.topicCompletedAt ??
        prisma.userProgress
          .findFirst({
            where: { userId, status: "completed" },
            orderBy: { completedAt: "desc" },
            select: { completedAt: true },
          })
          .then((r) => r?.completedAt ?? null),
    ]);

  const earnedIds = new Set(earnedRows.map((r) => r.badgeId));

  // Per-domain rollups
  const startedDomains = new Set<string>();
  const domainTopicTotals = new Map<string, { done: number; total: number }>();
  for (const p of perDomain) {
    const did = p.topic.roadmap.domainId;
    startedDomains.add(did);
    if (!domainTopicTotals.has(did)) domainTopicTotals.set(did, { done: 0, total: 0 });
    if (p.status === "completed") domainTopicTotals.get(did)!.done++;
  }
  // We need totals per domain from the roadmaps themselves
  if (domainTopicTotals.size > 0) {
    const totals = await prisma.roadmap.findMany({
      where: { domainId: { in: [...domainTopicTotals.keys()] } },
      select: { domainId: true, totalTopics: true },
    });
    for (const t of totals) {
      const entry = domainTopicTotals.get(t.domainId);
      if (entry) entry.total = t.totalTopics;
    }
  }
  const domainsCompleted = [...domainTopicTotals.values()].filter(
    (d) => d.total > 0 && d.done >= d.total
  ).length;

  const newAwards: BadgeAward[] = [];

  for (const b of allBadges) {
    if (earnedIds.has(b.id)) continue;
    const c = b.criteria as unknown as BadgeCriteria;
    let earned = false;

    switch (c.type) {
      case "topics_completed":
        earned = completedCount >= c.value;
        break;
      case "streak_days":
        earned = (streak?.currentStreak ?? 0) >= c.value || (streak?.longestStreak ?? 0) >= c.value;
        break;
      case "perfect_quizzes":
        earned = perfectCount >= c.value;
        break;
      case "domains_started":
        earned = startedDomains.size >= c.value;
        break;
      case "domains_completed":
        earned = domainsCompleted >= c.value;
        break;
      case "topic_completed_after_midnight":
        if (lastCompletion) {
          const h = new Date(lastCompletion).getHours();
          earned = h >= 0 && h < 4;
        }
        break;
      case "topic_completed_before_7am":
        if (lastCompletion) {
          const h = new Date(lastCompletion).getHours();
          earned = h >= 4 && h < 7;
        }
        break;
    }

    if (earned) {
      try {
        const award = await prisma.userBadge.create({
          data: { userId, badgeId: b.id },
          select: { earnedAt: true },
        });
        newAwards.push({
          slug: b.slug,
          name: b.name,
          description: b.description,
          icon: b.icon,
          earnedAt: award.earnedAt,
        });
      } catch (err) {
        // Race: someone else granted the same badge in parallel.
        log.warn("badge already awarded (race)", { slug: b.slug, userId });
      }
    }
  }

  return newAwards;
}

// ─── Public read APIs ────────────────────────────────────────

export async function getStreak(userId: string) {
  await ensureBadgesSeeded();
  const s = await getStreakSafe(userId);
  return {
    currentStreak: s.currentStreak,
    longestStreak: s.longestStreak,
    freezesAvailable: s.freezesAvailable,
    lastActiveDate: s.lastActiveDate?.toISOString().slice(0, 10) ?? null,
  };
}

export async function getBadges(userId: string) {
  await ensureBadgesSeeded();
  const [allBadges, earned] = await Promise.all([
    prisma.badge.findMany({ orderBy: { orderIndex: "asc" } }),
    prisma.userBadge.findMany({ where: { userId } }),
  ]);
  const earnedMap = new Map(earned.map((e) => [e.badgeId, e.earnedAt]));
  return allBadges.map((b) => ({
    slug: b.slug,
    name: b.name,
    description: b.description,
    icon: b.icon,
    earnedAt: earnedMap.get(b.id) ?? null,
  }));
}

/**
 * Top 10 by XP earned this ISO week (Monday → now, UTC).
 */
export async function getLeaderboard() {
  const weekStart = startOfIsoWeekUtc(new Date());
  const rows = await prisma.xpEvent.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: weekStart } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 10,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: { id: true, name: true, level: true, xp: true },
  });
  const map = new Map(users.map((u) => [u.id, u]));

  return rows
    .map((r, i) => {
      const u = map.get(r.userId);
      if (!u) return null;
      return {
        rank: i + 1,
        userId: u.id,
        name: u.name,
        level: u.level,
        xpTotal: u.xp,
        xpThisWeek: r._sum.amount ?? 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

// ─── Composite hook used by topic + quiz services ────────────

export type GamificationDelta = {
  xp: { totalAwarded: number; newXp: number; events: XpAward[]; oldLevel: number; newLevel: number };
  streak: StreakUpdate;
  badges: BadgeAward[];
};

/**
 * Convenience: record an action, award the right XP (including first-of-day,
 * streak_day and comeback bonuses), evaluate badges, return everything for the
 * client to surface as toasts / animations.
 */
export async function recordTopicComplete(
  userId: string,
  ctx: { topicId: string }
): Promise<GamificationDelta> {
  const streak = await recordActivity(userId);
  const isFirstOfDay = streak.changedToday;

  const awards: XpAward[] = [{ amount: XP_AMOUNTS.topic_complete, reason: "topic_complete", meta: ctx }];
  if (isFirstOfDay) awards.push({ amount: XP_AMOUNTS.first_topic_of_day, reason: "first_topic_of_day", meta: ctx });
  if (streak.changedToday && !streak.comebackBonus) {
    awards.push({ amount: XP_AMOUNTS.streak_day, reason: "streak_day" });
  }
  if (streak.comebackBonus) {
    awards.push({ amount: XP_AMOUNTS.comeback, reason: "comeback" });
  }

  const xp = await awardXp(userId, awards);
  const badges = await evaluateBadges(userId, { topicCompletedAt: new Date() });

  return { xp, streak, badges };
}

export async function recordQuizSubmit(
  userId: string,
  ctx: { topicId: string; score: number; total: number; passed: boolean }
): Promise<GamificationDelta> {
  const streak = await recordActivity(userId);
  const awards: XpAward[] = [];
  if (ctx.passed) {
    if (ctx.score === ctx.total) awards.push({ amount: XP_AMOUNTS.quiz_perfect, reason: "quiz_perfect", meta: ctx });
    else awards.push({ amount: XP_AMOUNTS.quiz_pass, reason: "quiz_pass", meta: ctx });
  }
  if (streak.changedToday && !streak.comebackBonus) {
    awards.push({ amount: XP_AMOUNTS.streak_day, reason: "streak_day" });
  }
  if (streak.comebackBonus) {
    awards.push({ amount: XP_AMOUNTS.comeback, reason: "comeback" });
  }

  const xp = await awardXp(userId, awards);
  const badges = await evaluateBadges(userId);

  return { xp, streak, badges };
}
