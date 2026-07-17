import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { remember, del } from "./cache.service";

const DOMAIN_PUBLIC = {
  id: true,
  slug: true,
  name: true,
  description: true,
  icon: true,
  color: true,
  difficulty: true,
  isCurated: true,
  orderIndex: true,
} as const;

const TOPIC_PUBLIC = {
  id: true,
  orderIndex: true,
  title: true,
  summary: true,
  difficulty: true,
  phase: true,
} as const;

/**
 * Domains, roadmaps and their topic lists are static content — they only
 * change when an admin edits the curriculum. We cache them so the common
 * read path (every gallery/roadmap page load, by every client) skips the
 * remote database entirely. Admin writes call invalidateContentCache().
 */
const CONTENT_TTL_SECONDS = 300; // 5 min safety net; also invalidated on write.

export async function listDomains() {
  const { value } = await remember("domains:list", CONTENT_TTL_SECONDS, () =>
    prisma.domain.findMany({
      orderBy: { orderIndex: "asc" },
      select: {
        ...DOMAIN_PUBLIC,
        roadmap: { select: { totalTopics: true, estimatedDays: true } },
      },
    })
  );
  return value;
}

export async function getDomainBySlug(slug: string) {
  const { value } = await remember(`domain:${slug}`, CONTENT_TTL_SECONDS, async () => {
    const domain = await prisma.domain.findUnique({
      where: { slug },
      select: {
        ...DOMAIN_PUBLIC,
        roadmap: {
          select: { id: true, title: true, totalTopics: true, estimatedDays: true },
        },
      },
    });
    if (!domain) throw new ApiError(404, "Domain not found");
    return domain;
  });
  return value;
}

/** Cached structural part of the roadmap (domain + roadmap + topics), no per-user data. */
async function getRoadmapStructure(slug: string) {
  const { value } = await remember(`roadmap:${slug}`, CONTENT_TTL_SECONDS, async () => {
    const domain = await prisma.domain.findUnique({
      where: { slug },
      select: {
        ...DOMAIN_PUBLIC,
        roadmap: {
          select: {
            id: true,
            title: true,
            totalTopics: true,
            estimatedDays: true,
            topics: { orderBy: { orderIndex: "asc" }, select: TOPIC_PUBLIC },
          },
        },
      },
    });
    if (!domain) throw new ApiError(404, "Domain not found");
    return domain;
  });
  return value;
}

/**
 * Roadmap view: domain + roadmap + topics overlaid with the caller's progress.
 *
 * The static structure is served from cache; the per-user progress is fetched
 * with a relation filter (no dependency on the topic-id list), so both run
 * concurrently — one round-trip instead of two sequential ones.
 */
export async function getRoadmapForUser(slug: string, userId: string) {
  const [domain, progress] = await Promise.all([
    getRoadmapStructure(slug),
    prisma.userProgress.findMany({
      where: { userId, topic: { roadmap: { domain: { slug } } } },
      select: { topicId: true, status: true, bestScore: true, completedAt: true },
    }),
  ]);

  if (!domain.roadmap) {
    return { ...domain, roadmap: null, progress: [] as typeof progress };
  }
  return { ...domain, progress };
}

/**
 * Drop cached domain/roadmap content so the next read reflects an admin edit.
 * Pass the affected domain slug when known; the gallery list is always cleared.
 */
export async function invalidateContentCache(slug?: string): Promise<void> {
  await del("domains:list");
  if (slug) {
    await Promise.all([del(`domain:${slug}`), del(`roadmap:${slug}`)]);
  }
}
