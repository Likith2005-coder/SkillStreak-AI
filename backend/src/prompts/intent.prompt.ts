import { complete } from "../services/llm.service";

export const INTENTS = [
  "explain",
  "roadmap",
  "quiz",
  "recommend",
  "doubt",
  "motivational",
] as const;

export type Intent = (typeof INTENTS)[number];

const CLASSIFIER_SYSTEM = `You are an intent classifier for a tech tutoring chatbot.
Classify the learner's latest message into exactly ONE of these intents:

- explain: asking what something is, how it works, definition, deep-dive
- roadmap: asking what to learn, in what order, study plan, "where do I start"
- quiz: asking to be tested, practice questions, MCQs, "quiz me"
- recommend: asking for resources, videos, books, articles, courses, links
- doubt: stuck on an error, code not working, debugging, "why doesn't this work"
- motivational: pep talk, lost motivation, feeling stuck, confidence-related

Output rules:
- Output ONLY the single intent label in lowercase.
- No punctuation, no explanation, no quotes.
- If uncertain, default to: explain.`;

const HEURISTICS: Array<{ rx: RegExp; intent: Intent }> = [
  { rx: /\b(quiz|test me|mcq|question(s)?\s+(on|about))\b/i, intent: "quiz" },
  { rx: /\b(roadmap|study plan|where (do|should) i start|learning path|in what order)\b/i, intent: "roadmap" },
  { rx: /\b(recommend|suggest|video(s)?|book(s)?|course(s)?|article(s)?|resource(s)?|link(s)?)\b/i, intent: "recommend" },
  { rx: /\b(error|bug|stuck|not working|why (doesn|does not|isn|is not)|throws?|crash|fix)\b/i, intent: "doubt" },
  { rx: /\b(motivat\w*|giv(e|ing) up|hate this|losing interest|burn(t|ed)? out|i can'?t do)\b/i, intent: "motivational" },
];

export function heuristicIntent(message: string): Intent | null {
  for (const { rx, intent } of HEURISTICS) {
    if (rx.test(message)) return intent;
  }
  return null;
}

/**
 * Classify a user message into one of the supported intents.
 * Cheap heuristics first; LLM fallback for ambiguous cases.
 */
export async function classifyIntent(message: string): Promise<Intent> {
  const trimmed = message.trim();
  if (!trimmed) return "explain";

  const hit = heuristicIntent(trimmed);
  if (hit) return hit;

  try {
    const raw = await complete({
      systemPrompt: CLASSIFIER_SYSTEM,
      userPrompt: trimmed.slice(0, 500),
      temperature: 0,
      maxTokens: 8,
    });
    const cleaned = raw.trim().toLowerCase().replace(/[^a-z]/g, "");
    if ((INTENTS as readonly string[]).includes(cleaned)) return cleaned as Intent;
  } catch {
    // fall through to default
  }
  return "explain";
}
