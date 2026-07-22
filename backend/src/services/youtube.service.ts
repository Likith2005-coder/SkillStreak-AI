/**
 * YouTube resolution — returns direct links to the *best real* videos for a
 * topic. The client never sees a YouTube search page; they get a perfect
 * watch link to a specific, verified video.
 *
 * Two resolution strategies, tried in order:
 *
 * 1. YouTube Data API v3 (searchViaApi) — used when YOUTUBE_API_KEY is set.
 *    Cleanest and most robust; returns relevance-ranked live videos.
 *
 * 2. Keyless resolution (searchViaScrape) — reads YouTube's own public search
 *    results page (server-side) to get the real, relevance-ranked video ids,
 *    then enriches each via the public oEmbed endpoint (which also proves the
 *    video exists). No API key or quota required.
 *
 * Both paths return the same shape and only ever yield videos that resolve to
 * a real, watchable page — verified, never hallucinated.
 */

import { env } from "../config/env";
import { log } from "../utils/logger.util";
import { CircuitBreaker } from "../utils/circuit-breaker";

export type YtVideo = {
  videoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/**
 * All YouTube traffic (Data API, search-page scrape, oEmbed) shares one breaker.
 * YouTube isn't essential — when it's slow or down the breaker trips and every
 * helper degrades to [] / null, so resource generation falls back to a plain
 * search link instead of hanging on dozens of stalled fetches.
 */
const youtubeBreaker = new CircuitBreaker({
  name: "youtube",
  timeoutMs: 6_000,
  maxConcurrent: 8,
  failureThreshold: 5,
  resetTimeoutMs: 20_000,
  successThreshold: 2,
});

/** fetch() routed through the breaker: adds a timeout and counts 5xx as failures. */
async function ytFetch(url: string, init?: RequestInit): Promise<Response> {
  return youtubeBreaker.execute(async (signal) => {
    const res = await fetch(url, { ...init, signal });
    if (!res.ok) throw new Error(`youtube fetch failed: ${res.status}`);
    return res;
  });
}

/** Whether a real YouTube Data API key is configured. */
export function hasYoutubeApi(): boolean {
  return typeof env.YOUTUBE_API_KEY === "string" && env.YOUTUBE_API_KEY.trim().length > 0;
}

function thumb(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Decode the HTML entities YouTube returns in titles (&amp;, &#39;, ...). */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}

/**
 * Resolve the top `max` real videos for a query, as direct watch links.
 * Returns [] only if nothing could be resolved (caller degrades gracefully).
 */
export async function searchTopVideos(query: string, max = 4): Promise<YtVideo[]> {
  if (hasYoutubeApi()) {
    const viaApi = await searchViaApi(query, max);
    if (viaApi.length > 0) return viaApi;
    log.warn("youtube api returned nothing; falling back to keyless resolution", { query });
  }
  return searchViaScrape(query, max);
}

// ─── Strategy 1: YouTube Data API v3 ────────────────────────────────────────

async function searchViaApi(query: string, max: number): Promise<YtVideo[]> {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    maxResults: String(Math.min(10, Math.max(1, max))),
    q: query,
    relevanceLanguage: "en",
    safeSearch: "moderate",
    key: env.YOUTUBE_API_KEY!.trim(),
  });
  try {
    const res = await ytFetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    const data = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: { title?: string; channelTitle?: string };
      }>;
    };
    return (data.items ?? [])
      .filter((it) => it?.id?.videoId)
      .map((it) => {
        const videoId = it.id!.videoId!;
        return {
          videoId,
          title: decodeEntities(it.snippet?.title ?? "Video"),
          channel: decodeEntities(it.snippet?.channelTitle ?? "YouTube"),
          thumbnailUrl: thumb(videoId),
          durationSeconds: null,
        };
      })
      .slice(0, max);
  } catch (err) {
    log.warn("youtube api search error", { error: err instanceof Error ? err.message : String(err) });
    return [];
  }
}

// ─── Strategy 2: keyless resolution via public search page + oEmbed ─────────

/** Extract unique, in-order video ids from a YouTube search results page. */
async function scrapeVideoIds(query: string, limit: number): Promise<string[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en&gl=US`;
  try {
    const res = await ytFetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "en-US,en;q=0.9",
        Cookie: "CONSENT=YES+1",
      },
    });
    const html = await res.text();
    const ids: string[] = [];
    const seen = new Set<string>();
    const re = /"videoId":"([A-Za-z0-9_-]{11})"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) && ids.length < limit) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        ids.push(m[1]);
      }
    }
    return ids;
  } catch (err) {
    log.warn("youtube search page error", { error: err instanceof Error ? err.message : String(err) });
    return [];
  }
}

/** Fetch a video's real title + channel via oEmbed. null if it doesn't exist. */
async function fetchOembed(
  videoId: string
): Promise<{ title: string; channel: string } | null> {
  try {
    const target = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await ytFetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(target)}&format=json`
    );
    const j = (await res.json()) as { title?: string; author_name?: string };
    return { title: j.title ?? "Video", channel: j.author_name ?? "YouTube" };
  } catch {
    return null;
  }
}

async function searchViaScrape(query: string, max: number): Promise<YtVideo[]> {
  // Over-fetch candidates so we can skip any that turn out to be dead/private.
  const candidates = await scrapeVideoIds(query, max * 4);
  const out: YtVideo[] = [];
  for (const id of candidates) {
    if (out.length >= max) break;
    const meta = await fetchOembed(id);
    if (!meta) continue; // dead / private / removed — skip
    out.push({
      videoId: id,
      title: meta.title,
      channel: meta.channel,
      thumbnailUrl: thumb(id),
      durationSeconds: null,
    });
  }
  return out;
}

/**
 * Keyless existence check for a single id (used to verify LLM-proposed links
 * in the fallback path). Returns true only for a real, public video.
 */
export async function videoExists(videoId: string): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return false;
  return (await fetchOembed(videoId)) !== null;
}
