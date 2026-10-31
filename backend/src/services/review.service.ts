/**
 * Mistake Review: the questions a learner got wrong in recent quizzes, served
 * back one at a time. No extra tables — a mistake is derived from
 * quiz_attempts, and it counts as "fixed" once an xp_events row with
 * reason = 'review' and meta.key = <key> exists.
 */

import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { log } from "../utils/logger.util";
import { collectMistakes, type Mistake } from "../utils/review.util";
import { REVIEW_XP, recordReviewFix, type GamificationDelta } from "./gamification.service";

const WINDOW_DAYS = 60;
const MAX_ITEMS = 20;

export type ReviewItem = {
  key: string;
  topicId: string;
  topicTitle: string;
  domain: { slug: string; name: string; color: string; icon: string };
  question: string;
  options: string[];
  /** What the learner picked last time (-1 if unknown). */
  lastAnswer: number;
  attemptedAt: Date;
};

async function fixedKeysFor(userId: string): Promise<Set<string>> {
  const rows = await prisma.xpEvent.findMany({
    where: { userId, reason: "review" },
    select: { meta: true },
  });
  const keys = new Set<string>();
  for (const r of rows) {
    const k = (r.meta as { key?: unknown } | null)?.key;
    if (typeof k === "string") keys.add(k);
  }
  return keys;
}

async function recentAttempts(userId: string) {
  const since = new Date(Date.now() - WINDOW_DAYS * 86400000);
  return prisma.quizAttempt.findMany({
    where: { userId, attemptedAt: { gte: since } },
    orderBy: { attemptedAt: "desc" },
    select: { topicId: true, attemptedAt: true, questions: true, userAnswers: true },
  });
}

export async function getReview(userId: string): Promise<{ items: ReviewItem[]; total: number }> {
  const [attempts, fixed] = await Promise.all([recentAttempts(userId), fixedKeysFor(userId)]);
  const mistakes = collectMistakes(attempts, fixed);
  const page = mistakes.slice(0, MAX_ITEMS);

  const topicIds = [...new Set(page.map((m) => m.topicId))];
  const topics = topicIds.length
    ? await prisma.topic.findMany({
        where: { id: { in: topicIds } },
        select: {
          id: true,
          title: true,
          roadmap: { select: { domain: { select: { slug: true, name: true, color: true, icon: true } } } },
        },
      })
    : [];
  const byId = new Map(topics.map((t) => [t.id, t]));

  const items: ReviewItem[] = [];
  for (const m of page) {
    const t = byId.get(m.topicId);
    if (!t) continue; // topic deleted since the attempt
    items.push({
      key: m.key,
      topicId: m.topicId,
      topicTitle: t.title,
      domain: t.roadmap.domain,
      question: m.question,
      options: m.options,
      lastAnswer: m.selectedIndex,
      attemptedAt: m.attemptedAt,
    });
  }

  return { items, total: mistakes.length };
}

// Keys currently being awarded. The "already fixed?" check and the XP write
// aren't one atomic step, so two simultaneous correct answers could both pay;
// claiming the key here first makes the second one see it as taken. (One
// backend process; a multi-instance deploy would need a DB-level lock.)
const awarding = new Set<string>();

export async function answerReview(opts: {
  userId: string;
  key: string;
  selectedIndex: number;
}): Promise<{
  correct: boolean;
  correctIndex: number;
  explanation: string;
  xpAwarded: number;
  gamification: GamificationDelta | null;
}> {
  // Re-derive server-side, ignoring the fixed set so an already-fixed key
  // still gets feedback (but no XP).
  const [attempts, fixed] = await Promise.all([recentAttempts(opts.userId), fixedKeysFor(opts.userId)]);
  const item: Mistake | undefined = collectMistakes(attempts, new Set()).find((m) => m.key === opts.key);
  if (!item) throw new ApiError(404, "Review item not found");
  if (opts.selectedIndex >= item.options.length) throw new ApiError(400, "Answer out of range");

  const correct = opts.selectedIndex === item.correctIndex;
  let gamification: GamificationDelta | null = null;
  let xpAwarded = 0;

  const claim = `${opts.userId}:${item.key}`;
  if (correct && !fixed.has(item.key) && !awarding.has(claim)) {
    awarding.add(claim);
    try {
      gamification = await recordReviewFix(opts.userId, { key: item.key, topicId: item.topicId });
      xpAwarded = REVIEW_XP;
    } catch (err) {
      log.warn("recordReviewFix failed", { error: err instanceof Error ? err.message : String(err) });
      // The XP write may have landed before a later step (badges) failed;
      // report what's actually in the ledger.
      if ((await fixedKeysFor(opts.userId)).has(item.key)) xpAwarded = REVIEW_XP;
    } finally {
      awarding.delete(claim);
    }
  }

  return {
    correct,
    correctIndex: item.correctIndex,
    explanation: item.explanation,
    xpAwarded,
    gamification,
  };
}
