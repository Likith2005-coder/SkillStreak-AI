import { Intent } from "./intent.prompt";

/**
 * Intent-specific instruction layer appended to the system prompt.
 * Keeps the base persona stable while shaping the response format.
 */
export function intentInstructions(intent: Intent): string {
  switch (intent) {
    case "explain":
      return `\nINTENT: explain.
Structure: 1-line definition → 3 key points → 1 real-world example → 1 common misconception.
Use Markdown headings.`;

    case "roadmap":
      return `\nINTENT: roadmap.
Output an ordered learning plan as a numbered Markdown list. Group into phases (Foundations, Core, Advanced).
For each item give 1 line of why it comes here. Cap at 12 items.`;

    case "quiz":
      return `\nINTENT: quiz.
Generate 3 multiple-choice questions on the topic. For each: question, four options labelled A-D, then "**Answer:** X — <one-line reason>" on its own line.
Wait until the end to reveal answers; render answers in a final "## Answers" section.`;

    case "recommend":
      return `\nINTENT: recommend.
Suggest 3-5 high-quality learning resources. Mix free YouTube channels, official docs, and well-known articles.
Format each as: **Title** — Source — 1-line why.
Do NOT invent URLs. If unsure of a URL, give the resource name only.`;

    case "doubt":
      return `\nINTENT: doubt / debugging.
Acknowledge the issue first. Then: (1) most likely cause, (2) one targeted diagnostic step, (3) a minimal fix.
If user shared code, refer to specific lines. If they didn't, ask one focused clarifying question at the end.`;

    case "motivational":
      return `\nINTENT: motivational.
Be warm but not saccharine. 3-4 short paragraphs max.
Acknowledge the feeling, normalize it (everyone hits this wall), and end with one concrete next step they can do in under 15 minutes.
Do not lecture. No bullet lists.`;
  }
}

/**
 * Suggested follow-up question generator prompt — appended after main response so
 * we get follow-ups in the same call (cheaper) when needed at session end.
 */
export const FOLLOWUPS_SYSTEM = `Generate exactly 3 short follow-up questions a learner might ask next, given the previous assistant response.
Output ONLY a JSON array of 3 strings, no commentary, no Markdown fences.
Each question max 60 characters, written in first person ("How do I...", "Can you...", "Why does...").`;
