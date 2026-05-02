import { cache } from "../config/redis";

/**
 * JSON-typed wrapper over the Redis-or-in-memory cache.
 * Use for LLM response caching (topic explanations, quizzes, etc.).
 */

export async function getJson<T>(key: string): Promise<T | null> {
  const raw = await cache.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // corrupt entry; drop it.
    await cache.del(key);
    return null;
  }
}

export async function setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  await cache.set(key, JSON.stringify(value), ttlSeconds);
}

export async function del(key: string): Promise<void> {
  await cache.del(key);
}

/**
 * Cache-aside helper: returns cached value or computes + caches it.
 */
export async function remember<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<{ value: T; cached: boolean }> {
  const hit = await getJson<T>(key);
  if (hit !== null) return { value: hit, cached: true };

  const value = await compute();
  await setJson(key, value, ttlSeconds);
  return { value, cached: false };
}
