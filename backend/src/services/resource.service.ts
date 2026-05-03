/**
 * Phase 7 — Per-topic resources (curated videos + docs).
 *
 * Strategy:
 * - Persisted in the `resources` table; cached for 7 days.
 * - YouTube Data API v3 is OPTIONAL: if YOUTUBE_API_KEY is set, we'd hit the
 *   real API for video search. Not yet wired — see notes below. For now we
 *   have the LLM propose 3-5 video search queries and we build canonical
 *   `youtube.com/results?search_query=...` links. They're not fabricated URLs;
 *   they're real search pages the learner can click into.
 * - For docs, the LLM is asked to suggest titles + canonical URLs from a
 *   well-known source list (MDN, official framework docs, OWASP, etc.).
 *   Quality scoring + click-through tracking come later.
 */

import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { complete } from "./llm.service";
import { log } from "../utils/logger.util";

const RESOURCES_TTL_DAYS = 7;
const MAX_VIDEOS = 4;
const MAX_DOCS = 3;

const RESOURCE_SYSTEM = `You are a tech learning librarian.
Given a topic, propose high-quality external learning resources.

Output ONLY this JSON shape — no Markdown fences, no commentary:

{
  "videos": [
    { "title": "string — short descriptive title", "channel": "string — channel name", "searchQuery": "string — concise YouTube search query under 80 chars" }
  ],
  "docs": [
    { "title": "string", "source": "string — e.g. MDN, OWASP, Wikipedia, Mozilla, web.dev, scikit-learn, fast.ai", "url": "string — full https URL on the source's official domain" }
  ]
}

RULES
- Exactly ${MAX_VIDEOS} videos and ${MAX_DOCS} docs.
- Video channel suggestions should be reputable educational channels (e.g. freeCodeCamp, NetworkChuck, 3Blue1Brown, Computerphile, Fireship, IBM Technology, CS50, Krish Naik, Stanford Online).
- Doc URLs must be on the source's official domain. If unsure of a specific deep link, give the source's main hub URL.
- Prefer evergreen, beginner-readable resources unless the topic is clearly advanced.`;

type LlmResource = {
  videos: Array<{ title: string; channel: string; searchQuery: string }>;
  docs: Array<{ title: string; source: string; url: string }>;
};

function stripJsonFences(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function safeUrl(u: string): string | null {
  try {
    const url = new URL(u);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function buildYoutubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query.slice(0, 200))}`;
}

async function generateForTopic(topic: { id: string; title: string; summary: string }): Promise<LlmResource> {
  const raw = await complete({
    systemPrompt: RESOURCE_SYSTEM,
    userPrompt: `Topic: ${topic.title}\n\nSummary: ${topic.summary}`,
    temperature: 0.4,
    maxTokens: 700,
  });
  const cleaned = stripJsonFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ApiError(502, "Resource generator returned invalid JSON");
  }
  const obj = parsed as Partial<LlmResource>;
  if (
    !obj ||
    !Array.isArray(obj.videos) ||
    !Array.isArray(obj.docs)
  ) {
    throw new ApiError(502, "Resource JSON missing arrays");
  }
  return {
    videos: obj.videos
      .filter(
        (v) =>
          v &&
          typeof v.title === "string" &&
          typeof v.channel === "string" &&
          typeof v.searchQuery === "string"
      )
      .slice(0, MAX_VIDEOS),
    docs: obj.docs
      .filter(
        (d) =>
          d &&
          typeof d.title === "string" &&
          typeof d.source === "string" &&
          typeof d.url === "string"
      )
      .slice(0, MAX_DOCS),
  };
}

export type PublicResource = {
  id: string;
  type: "video" | "doc";
  title: string;
  url: string;
  source: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
};

export async function getResources(
  topicId: string
): Promise<{ videos: PublicResource[]; docs: PublicResource[]; cached: boolean }> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, title: true, summary: true },
  });
  if (!topic) throw new ApiError(404, "Topic not found");

  // Check cache (any resource < TTL old).
  const cutoff = new Date(Date.now() - RESOURCES_TTL_DAYS * 86400 * 1000);
  const cached = await prisma.resource.findMany({
    where: { topicId, createdAt: { gte: cutoff } },
    orderBy: [{ type: "asc" }, { orderIndex: "asc" }],
  });
  if (cached.length > 0) {
    return splitByType(cached, true);
  }

  // Generate fresh, replace any stale entries.
  let llm: LlmResource;
  try {
    llm = await generateForTopic(topic);
  } catch (err) {
    log.error("resource generation failed", {
      topicId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err instanceof ApiError ? err : new ApiError(502, "Could not generate resources");
  }

  // Replace stale rows for this topic.
  await prisma.resource.deleteMany({ where: { topicId } });

  const videoRows = llm.videos
    .map((v, i) => {
      const url = buildYoutubeSearchUrl(v.searchQuery);
      return {
        topicId,
        type: "video",
        title: v.title,
        url,
        source: v.channel || "YouTube",
        thumbnailUrl: null,
        durationSeconds: null,
        orderIndex: i,
        qualityScore: 0,
      };
    })
    .filter((r) => safeUrl(r.url));

  const docRows = llm.docs
    .map((d, i) => {
      const url = safeUrl(d.url);
      if (!url) return null;
      return {
        topicId,
        type: "doc",
        title: d.title,
        url,
        source: d.source,
        thumbnailUrl: null,
        durationSeconds: null,
        orderIndex: i,
        qualityScore: 0,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (videoRows.length + docRows.length === 0) {
    throw new ApiError(502, "Resource generator returned nothing usable");
  }

  await prisma.resource.createMany({ data: [...videoRows, ...docRows] });

  const fresh = await prisma.resource.findMany({
    where: { topicId },
    orderBy: [{ type: "asc" }, { orderIndex: "asc" }],
  });
  return splitByType(fresh, false);
}

function splitByType(
  rows: Array<{
    id: string;
    type: string;
    title: string;
    url: string;
    source: string;
    thumbnailUrl: string | null;
    durationSeconds: number | null;
  }>,
  cached: boolean
) {
  const map = (r: (typeof rows)[number]): PublicResource => ({
    id: r.id,
    type: r.type === "video" ? "video" : "doc",
    title: r.title,
    url: r.url,
    source: r.source,
    thumbnailUrl: r.thumbnailUrl,
    durationSeconds: r.durationSeconds,
  });
  return {
    videos: rows.filter((r) => r.type === "video").map(map),
    docs: rows.filter((r) => r.type === "doc").map(map),
    cached,
  };
}
