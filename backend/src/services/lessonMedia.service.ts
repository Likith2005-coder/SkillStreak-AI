import { getJson as getCached, setJson } from "./cache.service";

/**
 * Finds a real, related picture for a lesson from Wikipedia (images are hosted
 * on Wikimedia Commons, which serves them freely with a CC BY-SA licence).
 * Never throws: any network / parse failure resolves to null.
 */

export type LessonImage = {
  url: string;
  width?: number;
  height?: number;
  caption: string;
  sourceUrl: string;
  credit: string;
};

const IMAGE_TTL_SECONDS = 30 * 24 * 60 * 60;
const NO_IMAGE_TTL_SECONDS = 7 * 24 * 60 * 60;
const TARGET_WIDTH = 960;
const MIN_WIDTH = 200;
const MAX_ORIGINAL_WIDTH = 1600;
const HEADERS = {
  "User-Agent": "SkillStreakAI/1.0 (educational project)",
  Accept: "application/json",
};

type WikiImage = { source: string; width: number; height: number };
type WikiSummary = {
  type?: string;
  title?: string;
  description?: string;
  originalimage?: WikiImage;
  thumbnail?: WikiImage;
  content_urls?: { desktop?: { page?: string } };
};

/** Set when a request fails for a transient reason (timeout, 5xx, offline). */
type Ctx = { transientFailure: boolean };

async function getJson<T>(url: string, ctx: Ctx): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      if (res.status >= 500 || res.status === 429) ctx.transientFailure = true;
      return null;
    }
    return (await res.json()) as T;
  } catch {
    ctx.transientFailure = true;
    return null;
  }
}

function isPlaceholder(src: string): boolean {
  return /no[_ -]?image|placeholder|question[_ -]?book|ambox|edit-clear|wiki_letter/i.test(src);
}

/** Picks a ~960px rendition: widen the thumbnail via Wikimedia's /{n}px- path. */
function pickImage(s: WikiSummary): { url: string; width: number; height: number } | null {
  const orig = s.originalimage;
  const thumb = s.thumbnail;
  const ref = orig ?? thumb;
  if (!ref || !ref.source || isPlaceholder(ref.source)) return null;
  if (ref.width < MIN_WIDTH) return null;

  const aspect = ref.height / ref.width;

  if (orig && orig.width <= MAX_ORIGINAL_WIDTH && !/\.svg$/i.test(orig.source)) {
    return { url: orig.source, width: orig.width, height: orig.height };
  }
  // Thumbnail URLs look like .../thumb/a/ab/File.png/320px-File.png
  if (thumb && /\/\d+px-[^/]+$/.test(thumb.source)) {
    const width = orig ? Math.min(TARGET_WIDTH, orig.width) : TARGET_WIDTH;
    return {
      url: thumb.source.replace(/\/\d+px-([^/]+)$/, `/${width}px-$1`),
      width,
      height: Math.round(width * aspect),
    };
  }
  if (orig && orig.width <= MAX_ORIGINAL_WIDTH) {
    return { url: orig.source, width: orig.width, height: orig.height };
  }
  if (thumb && thumb.width >= MIN_WIDTH) {
    return { url: thumb.source, width: thumb.width, height: thumb.height };
  }
  return null;
}

async function imageFromArticle(title: string, ctx: Ctx): Promise<LessonImage | null> {
  const s = await getJson<WikiSummary>(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`,
    ctx
  );
  if (!s || s.type === "disambiguation") return null;
  const img = pickImage(s);
  if (!img) return null;
  const name = s.title ?? title;
  return {
    ...img,
    caption: s.description ? `${name} — ${s.description}` : name,
    sourceUrl:
      s.content_urls?.desktop?.page ??
      `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`,
    credit: "Wikipedia · CC BY-SA",
  };
}

async function searchTitles(query: string, ctx: Ctx): Promise<string[]> {
  const data = await getJson<{ query?: { search?: { title: string }[] } }>(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&format=json&srlimit=3`,
    ctx
  );
  return data?.query?.search?.map((r) => r.title) ?? [];
}

async function findImage(articleTitle: string, fallbackQuery: string, ctx: Ctx): Promise<LessonImage | null> {
  const title = articleTitle.trim();
  if (title) {
    const direct = await imageFromArticle(title, ctx);
    if (direct) return direct;
  }
  const tried = new Set([title.toLowerCase()]);
  for (const query of [title, fallbackQuery].filter(Boolean)) {
    for (const candidate of await searchTitles(query, ctx)) {
      if (tried.has(candidate.toLowerCase())) continue;
      tried.add(candidate.toLowerCase());
      const img = await imageFromArticle(candidate, ctx);
      if (img) return img;
    }
  }
  return null;
}

export async function getLessonImage(
  articleTitle: string,
  fallbackQuery: string
): Promise<LessonImage | null> {
  try {
    const key = `lesson-image:v1:${(articleTitle || fallbackQuery).trim().toLowerCase()}`;
    const hit = await getCached<{ image: LessonImage | null }>(key);
    if (hit) return hit.image;
    const ctx: Ctx = { transientFailure: false };
    const image = await findImage(articleTitle, fallbackQuery, ctx);
    // Cache hits and genuine "nothing relevant" answers (wrapped, since a bare
    // null reads as a miss); skip caching when Wikipedia was just unreachable.
    if (image || !ctx.transientFailure) {
      await setJson(key, { image }, image ? IMAGE_TTL_SECONDS : NO_IMAGE_TTL_SECONDS);
    }
    return image;
  } catch {
    return null;
  }
}
