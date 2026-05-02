import Redis from "ioredis";
import { env } from "./env";

/**
 * Redis client with an in-memory fallback for local dev.
 *
 * If REDIS_URL is empty, we use a Map-backed cache and the health check
 * reports "in-memory". This keeps Phase 0+ usable without Docker or
 * cloud signups. Production sets REDIS_URL to a real Upstash/Redis URL.
 */

const useInMemory = !env.REDIS_URL;

const memoryStore = new Map<string, { value: string; expiresAt?: number }>();

export const redis = useInMemory
  ? null
  : new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });

if (redis) {
  let lastErrorCode: string | undefined;
  redis.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code !== lastErrorCode) {
      lastErrorCode = err.code;
      console.error(`[redis] ${err.code ?? "ERROR"}: ${err.message || "connection failed"}`);
    }
  });
}

export async function pingRedis(): Promise<"up" | "down" | "in-memory"> {
  if (!redis) return "in-memory";
  try {
    if (redis.status === "wait" || redis.status === "end") {
      await redis.connect();
    }
    const reply = await redis.ping();
    return reply === "PONG" ? "up" : "down";
  } catch {
    return "down";
  }
}

export const cache = {
  async get(key: string): Promise<string | null> {
    if (redis) return redis.get(key);
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (redis) {
      if (ttlSeconds) await redis.set(key, value, "EX", ttlSeconds);
      else await redis.set(key, value);
      return;
    }
    memoryStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  },

  async del(key: string): Promise<void> {
    if (redis) {
      await redis.del(key);
      return;
    }
    memoryStore.delete(key);
  },
};
