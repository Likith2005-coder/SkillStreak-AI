import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { env } from "../config/env";
import { ApiError } from "../middleware/error.middleware";
import { log } from "../utils/logger.util";
import { BreakerRejection, CircuitBreaker } from "../utils/circuit-breaker";

/**
 * Breaker for text generation (chat / quiz / explanations / toolkit). A slow or
 * failing Gemini trips it so those paths fast-fail instead of piling up. Free
 * tier is ~15 req/min, so a low concurrency cap is also correct.
 */
const geminiBreaker = new CircuitBreaker({
  name: "gemini",
  timeoutMs: 30_000, // generation with large maxTokens can be slow
  maxConcurrent: 6,
  failureThreshold: 4,
  resetTimeoutMs: 15_000,
  successThreshold: 2,
});

/**
 * SEPARATE breaker for embeddings. Embeddings are a distinct dependency
 * (different model, non-critical background backfill) — bulkhead them so a
 * broken/slow embedding model can never trip the breaker that guards chat,
 * quizzes and explanations.
 */
const embedBreaker = new CircuitBreaker({
  name: "gemini-embed",
  timeoutMs: 15_000,
  maxConcurrent: 4,
  failureThreshold: 4,
  resetTimeoutMs: 30_000,
  successThreshold: 1,
});

export type CompletionOptions = {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type StreamOptions = {
  systemPrompt?: string;
  history: ChatTurn[];        // prior turns, oldest → newest
  userPrompt: string;          // current user message
  temperature?: number;
  maxTokens?: number;
};

let geminiClient: GoogleGenerativeAI | null = null;

function getGemini(): GoogleGenerativeAI {
  if (!env.GEMINI_API_KEY) {
    throw new ApiError(
      503,
      "Gemini API key not configured. Add GEMINI_API_KEY to backend/.env (get a free key at https://aistudio.google.com/app/apikey)."
    );
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return geminiClient;
}

async function completeGemini(opts: CompletionOptions): Promise<string> {
  const client = getGemini();
  const model = client.getGenerativeModel({
    model: env.LLM_MODEL,
    systemInstruction: opts.systemPrompt,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 800,
    },
  });

  const result = await geminiBreaker.execute((signal) =>
    model.generateContent(opts.userPrompt, { signal })
  );
  const text = result.response.text();
  if (!text) throw new ApiError(502, "LLM returned an empty response");
  return text;
}

function notImplemented(provider: string): never {
  throw new ApiError(
    501,
    `LLM provider "${provider}" is not implemented. Switch LLM_PROVIDER to "gemini" in backend/.env or install the SDK and add the implementation.`
  );
}

/**
 * Complete a prompt using the configured LLM provider.
 * Retries once on transient failure.
 */
export async function complete(opts: CompletionOptions): Promise<string> {
  const provider = env.LLM_PROVIDER;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      switch (provider) {
        case "gemini":
          return await completeGemini(opts);
        case "openai":
          return notImplemented("openai");
        case "anthropic":
          return notImplemented("anthropic");
      }
    } catch (err) {
      lastError = err;
      // Don't retry on user-fixable errors (missing key, not implemented, validation).
      if (err instanceof ApiError && err.status < 500) throw err;
      // Circuit open / load shed / timeout — the dependency is known-bad.
      // Fast-fail without a retry so we don't add latency on top of a stall.
      if (err instanceof BreakerRejection) {
        throw new ApiError(503, "AI service is temporarily busy. Please try again shortly.");
      }
      if (attempt < 2) {
        log.warn("LLM call failed, retrying", { provider, attempt });
        continue;
      }
    }
  }

  log.error("LLM call failed after retries", {
    provider,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });
  throw new ApiError(502, "Upstream LLM provider error. Try again in a moment.");
}

/**
 * Generate an embedding vector for the given text.
 * Uses Gemini's text-embedding-004 (768-dim) by default. The topics.embedding
 * column is `vector(1536)` from Phase 1 (sized for OpenAI text-embedding-3-small);
 * we right-pad with zeros to fit so the column doesn't need a migration.
 *
 * Returns a number[] of length 1536.
 */
const TARGET_EMBEDDING_DIM = 1536;
// gemini-embedding-001 (GA). Uses Matryoshka representation, so truncating its
// 3072-dim output down to 1536 below yields a valid, usable embedding.
const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";

export async function embedText(text: string): Promise<number[]> {
  if (env.LLM_PROVIDER !== "gemini") {
    notImplemented(env.LLM_PROVIDER);
  }
  const client = getGemini();
  const model = client.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });
  const trimmed = text.length > 8000 ? text.slice(0, 8000) : text;
  let result;
  try {
    result = await embedBreaker.execute((signal) => model.embedContent(trimmed, { signal }));
  } catch (err) {
    if (err instanceof BreakerRejection) {
      throw new ApiError(503, "Embedding service is temporarily busy. Please try again shortly.");
    }
    log.error("embedding call failed", { error: err instanceof Error ? err.message : String(err) });
    throw new ApiError(502, "Embedding generation failed");
  }
  const v = result.embedding?.values ?? [];
  if (!v.length) throw new ApiError(502, "Empty embedding returned");

  if (v.length === TARGET_EMBEDDING_DIM) return v;
  if (v.length > TARGET_EMBEDDING_DIM) return v.slice(0, TARGET_EMBEDDING_DIM);
  // Right-pad with zeros to fit the pgvector column.
  return [...v, ...new Array(TARGET_EMBEDDING_DIM - v.length).fill(0)];
}

/**
 * Stream a chat completion token-by-token.
 * Async iterator yields incremental text chunks. Caller is responsible for
 * accumulating the full text and persisting after the stream ends.
 */
export async function* streamComplete(opts: StreamOptions): AsyncGenerator<string, void, unknown> {
  if (env.LLM_PROVIDER !== "gemini") {
    notImplemented(env.LLM_PROVIDER);
  }

  const client = getGemini();
  const model = client.getGenerativeModel({
    model: env.LLM_MODEL,
    systemInstruction: opts.systemPrompt,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 800,
    },
  });

  const history: Content[] = opts.history.map((t) => ({
    role: t.role === "assistant" ? "model" : "user",
    parts: [{ text: t.content }],
  }));

  const chat = model.startChat({ history });

  try {
    // Guard stream *initiation* (connection + first response) with the breaker:
    // that's where a degraded Gemini hangs. The signal aborts the request if the
    // timeout fires; once streaming starts we iterate outside the breaker.
    const result = await geminiBreaker.execute((signal) =>
      chat.sendMessageStream(opts.userPrompt, { signal })
    );
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  } catch (err) {
    if (err instanceof BreakerRejection) {
      throw new ApiError(503, "AI chat is temporarily busy. Please try again shortly.");
    }
    log.error("LLM stream failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    throw new ApiError(502, "LLM stream interrupted. Try again.");
  }
}
