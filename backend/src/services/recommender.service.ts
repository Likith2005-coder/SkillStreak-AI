/**
 * Phase 7 — Embedding-based topic recommender.
 *
 * Approach:
 * - Each topic gets an embedding from "title + summary" via Gemini.
 * - Embeddings are backfilled lazily: any not-yet-embedded topic is embedded
 *   the first time getRecommendations() runs (capped per call so a fresh DB
 *   doesn't block the request).
 * - User's "interest" embedding = mean of completed topic embeddings.
 *   If the user has completed nothing, fall back to the first topic of their
 *   preferred domains (Phase 5 already does this for "next topic").
 * - Top-K not-completed topics by 1 - cosine_distance.
 *
 * pgvector is enabled (Phase 1 migration) and the column is `vector(1536)`.
 */

import { prisma } from "../config/db";
import { embedText } from "./llm.service";
import { log } from "../utils/logger.util";

const BACKFILL_PER_CALL = 8;     // cap embeddings generated per request
const RECOMMEND_LIMIT_DEFAULT = 6;

function vectorLiteral(v: number[]): string {
  // pgvector accepts the literal '[1,2,3]' format.
  return "[" + v.join(",") + "]";
}

/**
 * Embed up to BACKFILL_PER_CALL topics that don't yet have an embedding.
 * Logs failures but doesn't throw — we want recommendations to still work
 * with whatever's already embedded.
 */
async function backfillMissing(): Promise<number> {
  const missing = await prisma.$queryRawUnsafe<Array<{ id: string; title: string; summary: string }>>(
    `SELECT "id", "title", "summary"
       FROM "topics"
       WHERE "embedding" IS NULL
       ORDER BY "created_at" ASC
       LIMIT ${BACKFILL_PER_CALL}`
  );
  if (!missing.length) return 0;

  let done = 0;
  for (const t of missing) {
    try {
      const v = await embedText(`${t.title}\n\n${t.summary}`);
      await prisma.$executeRawUnsafe(
        `UPDATE "topics" SET "embedding" = $1::vector WHERE "id" = $2`,
        vectorLiteral(v),
        t.id
      );
      done++;
    } catch (err) {
      log.warn("topic embedding failed", {
        topicId: t.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return done;
}

type RecommendedTopic = {
  topicId: string;
  title: string;
  summary: string;
  phase: string;
  domain: { slug: string; name: string; color: string; icon: string };
  similarity: number;
  reason: "personalized" | "fallback_unstarted";
};

export async function getRecommendations(
  userId: string,
  limit = RECOMMEND_LIMIT_DEFAULT
): Promise<RecommendedTopic[]> {
  // Lazy backfill: cheap when up-to-date.
  const filled = await backfillMissing();
  if (filled > 0) log.info("topic embeddings backfilled", { count: filled });

  // Get user's completed topics with embeddings.
  const completed = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT t."id"
       FROM "user_progress" p
       JOIN "topics" t ON t."id" = p."topic_id"
       WHERE p."user_id" = $1 AND p."status" = 'completed' AND t."embedding" IS NOT NULL`,
    userId
  );

  const completedIdsSql = completed.length
    ? completed.map((c) => `'${c.id}'`).join(",")
    : "''"; // matches nothing; keeps SQL valid

  let rows: Array<{
    id: string;
    title: string;
    summary: string;
    phase: string;
    similarity: number;
    domain_slug: string;
    domain_name: string;
    domain_color: string;
    domain_icon: string;
  }>;

  if (completed.length > 0) {
    // Compute average completed embedding inline, then sort the rest by cosine distance.
    rows = await prisma.$queryRawUnsafe(
      `WITH user_vec AS (
         SELECT AVG(t."embedding"::vector)::vector AS v
           FROM "user_progress" p
           JOIN "topics" t ON t."id" = p."topic_id"
          WHERE p."user_id" = $1 AND p."status" = 'completed' AND t."embedding" IS NOT NULL
       )
       SELECT t."id",
              t."title",
              t."summary",
              t."phase",
              d."slug" AS domain_slug,
              d."name" AS domain_name,
              d."color" AS domain_color,
              d."icon" AS domain_icon,
              1 - (t."embedding" <=> (SELECT v FROM user_vec)) AS similarity
         FROM "topics" t
         JOIN "roadmaps" r ON r."id" = t."roadmap_id"
         JOIN "domains" d ON d."id" = r."domain_id"
        WHERE t."embedding" IS NOT NULL
          AND t."id" NOT IN (${completedIdsSql})
        ORDER BY t."embedding" <=> (SELECT v FROM user_vec) ASC
        LIMIT ${Number(limit) | 0}`,
      userId
    );
    return rows.map((r) => ({
      topicId: r.id,
      title: r.title,
      summary: r.summary,
      phase: r.phase,
      domain: { slug: r.domain_slug, name: r.domain_name, color: r.domain_color, icon: r.domain_icon },
      similarity: Number(r.similarity ?? 0),
      reason: "personalized",
    }));
  }

  // Cold start: user has no completed topics. Return the first not-started
  // foundations topics across curated domains.
  const cold = await prisma.topic.findMany({
    where: {
      phase: "foundations",
      progress: { none: { userId } },
    },
    orderBy: [{ roadmap: { domain: { orderIndex: "asc" } } }, { orderIndex: "asc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      summary: true,
      phase: true,
      roadmap: {
        select: { domain: { select: { slug: true, name: true, color: true, icon: true } } },
      },
    },
  });
  return cold.map((t) => ({
    topicId: t.id,
    title: t.title,
    summary: t.summary,
    phase: t.phase,
    domain: t.roadmap.domain,
    similarity: 0,
    reason: "fallback_unstarted",
  }));
}
