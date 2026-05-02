import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";

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

export async function listDomains() {
  return prisma.domain.findMany({
    orderBy: { orderIndex: "asc" },
    select: {
      ...DOMAIN_PUBLIC,
      roadmap: { select: { totalTopics: true, estimatedDays: true } },
    },
  });
}

export async function getDomainBySlug(slug: string) {
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
        },
      },
    },
  });
  if (!domain) throw new ApiError(404, "Domain not found");
  return domain;
}

/**
 * Roadmap view: domain + roadmap + topics overlaid with the caller's progress.
 * If the domain isn't curated (no roadmap), returns the domain only.
 */
export async function getRoadmapForUser(slug: string, userId: string) {
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
          topics: {
            orderBy: { orderIndex: "asc" },
            select: TOPIC_PUBLIC,
          },
        },
      },
    },
  });
  if (!domain) throw new ApiError(404, "Domain not found");

  if (!domain.roadmap) {
    return { ...domain, roadmap: null, progress: [] as Array<{ topicId: string; status: string }> };
  }

  const progress = await prisma.userProgress.findMany({
    where: { userId, topicId: { in: domain.roadmap.topics.map((t) => t.id) } },
    select: {
      topicId: true,
      status: true,
      bestScore: true,
      completedAt: true,
    },
  });

  return { ...domain, progress };
}
