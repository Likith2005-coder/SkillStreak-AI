import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { ApiError } from "../middleware/error.middleware";
import { log } from "../utils/logger.util";

export type CompletionOptions = {
  systemPrompt?: string;
  userPrompt: string;
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

  const result = await model.generateContent(opts.userPrompt);
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
