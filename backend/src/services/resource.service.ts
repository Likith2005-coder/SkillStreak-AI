/**
 * Phase 7 — Per-topic resources (curated videos + docs).
 *
 * Strategy:
 * - Persisted in the `resources` table; cached for 7 days.
 * - The LLM proposes a direct YouTube watch URL plus a fallback search query
 *   for each video. We validate the URL — if it parses as a youtube.com/watch
 *   URL, we use it directly (user lands on a real video). If validation
 *   fails (hallucinated ID, wrong domain), we fall back to a canonical
 *   `youtube.com/results?search_query=...` link.
 * - For docs, the LLM is asked to suggest titles + canonical URLs from a
 *   well-known source list (MDN, official framework docs, OWASP, etc.).
 */

import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { complete } from "./llm.service";
import { log } from "../utils/logger.util";
import * as youtube from "./youtube.service";

const RESOURCES_TTL_DAYS = 7;
const MAX_VIDEOS = 4;
const MAX_DOCS = 3;

const RESOURCE_SYSTEM = `You are a tech learning librarian.
Given a topic, propose high-quality external learning resources.

Output ONLY this JSON shape — no Markdown fences, no commentary:

{
  "videos": [
    {
      "title": "string — short descriptive title",
      "channel": "string — channel name",
      "videoUrl": "string — full https://www.youtube.com/watch?v=ID URL of a real video you are confident exists",
      "searchQuery": "string — concise YouTube search query under 80 chars (used as fallback if videoUrl can't be verified)"
    }
  ],
  "docs": [
    { "title": "string", "source": "string — e.g. MDN, OWASP, Wikipedia, Mozilla, web.dev, scikit-learn, fast.ai", "url": "string — full https URL on the source's official domain" }
  ]
}

RULES
- Exactly ${MAX_VIDEOS} videos and ${MAX_DOCS} docs.
- Video channel suggestions should be reputable educational channels (e.g. freeCodeCamp, NetworkChuck, 3Blue1Brown, Computerphile, Fireship, IBM Technology, CS50, Krish Naik, Stanford Online).
- For "videoUrl": output the full URL of a real, well-known video on that channel that you remember exists. Only suggest a videoUrl if you are confident the ID is correct. If unsure, leave videoUrl as an empty string and we'll use searchQuery instead.
- Doc URLs must be on the source's official domain. If unsure of a specific deep link, give the source's main hub URL.
- Prefer evergreen, beginner-readable resources unless the topic is clearly advanced.`;

type LlmResource = {
  videos: Array<{ title: string; channel: string; videoUrl: string; searchQuery: string }>;
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

/**
 * Validate the LLM-proposed videoUrl. Returns the YouTube video ID if the
 * URL parses as a real watch URL on youtube.com or youtu.be, otherwise null.
 * We accept watch?v=ID, youtu.be/ID, and youtube.com/embed/ID forms.
 */
function extractYoutubeVideoId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

  const host = parsed.hostname.replace(/^www\./, "");
  let id: string | null = null;
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (parsed.pathname === "/watch") {
      id = parsed.searchParams.get("v");
    } else if (parsed.pathname.startsWith("/embed/")) {
      id = parsed.pathname.slice("/embed/".length);
    } else if (parsed.pathname.startsWith("/shorts/")) {
      id = parsed.pathname.slice("/shorts/".length);
    }
  } else if (host === "youtu.be") {
    id = parsed.pathname.replace(/^\//, "");
  }
  if (!id) return null;
  // YouTube IDs are 11 chars, [A-Za-z0-9_-].
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  return id;
}

function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
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
      .map((v) => ({
        title: v.title,
        channel: v.channel,
        videoUrl: typeof v.videoUrl === "string" ? v.videoUrl : "",
        searchQuery: v.searchQuery,
      }))
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

type VideoRow = {
  topicId: string;
  type: "video";
  title: string;
  url: string;
  source: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  orderIndex: number;
  qualityScore: number;
};

/**
 * Resolve the best real videos for a topic as DIRECT watch links — never a
 * YouTube search page and never a hallucinated id.
 *
 * Preference order:
 *   1. YouTube's own relevance-ranked results for the topic (Data API when a
 *      key is set, otherwise keyless resolution) — the actual best videos,
 *      with real titles, channels, and thumbnails, each verified live.
 *   2. If (and only if) that yields nothing, fall back to LLM-proposed watch
 *      URLs that oEmbed confirms are live.
 *   3. Absolute last resort (rare — both of the above returned nothing): a
 *      YouTube search link, so the row is still useful rather than broken.
 */
async function buildVideoRows(
  topicId: string,
  topic: { title: string; summary: string; domainName: string },
  llmVideos: LlmResource["videos"]
): Promise<VideoRow[]> {
  // Domain-qualified query disambiguates generic titles and biases toward the
  // right field, e.g. "Backpropagation Machine Learning".
  const query = topic.domainName
    ? `${topic.title} ${topic.domainName}`
    : topic.title;

  // 1. Preferred: real, relevance-ranked videos → direct links.
  const best = await youtube.searchTopVideos(query, MAX_VIDEOS);
  if (best.length > 0) {
    return best.map((v, i) => ({
      topicId,
      type: "video",
      title: v.title,
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      source: v.channel,
      thumbnailUrl: v.thumbnailUrl,
      durationSeconds: v.durationSeconds,
      orderIndex: i,
      qualityScore: 0,
    }));
  }
  log.warn("no direct videos resolved; trying verified LLM suggestions", { topicId });

  // 2. Fallback: oEmbed-verified LLM direct links.
  const rows = await Promise.all(
    llmVideos.map(async (v, i): Promise<VideoRow | null> => {
      const videoId = extractYoutubeVideoId(v.videoUrl);
      const exists = videoId ? await youtube.videoExists(videoId) : false;
      if (!exists || !videoId) return null;
      return {
        topicId,
        type: "video",
        title: v.title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        source: v.channel || "YouTube",
        thumbnailUrl: youtubeThumbnail(videoId),
        durationSeconds: null,
        orderIndex: i,
        qualityScore: 0,
      };
    })
  );
  const verified = rows.filter((r): r is VideoRow => r !== null);
  if (verified.length > 0) return verified.map((r, i) => ({ ...r, orderIndex: i }));

  // 3. Last resort: a single search link so the section isn't empty.
  log.warn("falling back to a search link for videos", { topicId });
  return [
    {
      topicId,
      type: "video",
      title: `Search: ${topic.title}`,
      url: buildYoutubeSearchUrl(query),
      source: "YouTube",
      thumbnailUrl: null,
      durationSeconds: null,
      orderIndex: 0,
      qualityScore: 0,
    },
  ];
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
  const topicRow = await prisma.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      title: true,
      summary: true,
      roadmap: { select: { domain: { select: { name: true } } } },
    },
  });
  if (!topicRow) throw new ApiError(404, "Topic not found");
  const topic = {
    id: topicRow.id,
    title: topicRow.title,
    summary: topicRow.summary,
    domainName: topicRow.roadmap?.domain?.name ?? "",
  };

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

  const videoRows = (await buildVideoRows(topicId, topic, llm.videos)).filter((r) =>
    safeUrl(r.url)
  );

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
