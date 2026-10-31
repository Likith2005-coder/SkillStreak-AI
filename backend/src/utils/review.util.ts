/**
 * Mistake Review — pure helpers (no DB), so the key derivation and the
 * "which questions are still mistakes" rule are unit-testable.
 */

import { createHash } from "node:crypto";

export type StoredQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type AttemptLike = {
  topicId: string;
  attemptedAt: Date;
  questions: unknown; // QuizAttempt.questions JSON
  userAnswers: unknown; // QuizAttempt.userAnswers JSON
};

export type Mistake = StoredQuestion & {
  key: string;
  topicId: string;
  selectedIndex: number;
  attemptedAt: Date;
};

/** Whitespace/case-insensitive so trivial regeneration noise maps to one key. */
function normalizeQuestion(q: string): string {
  return q.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Stable key for a (topic, question) pair: 20 hex chars of sha256. */
export function reviewKey(topicId: string, question: string): string {
  return createHash("sha256")
    .update(`${topicId}\n${normalizeQuestion(question)}`)
    .digest("hex")
    .slice(0, 20);
}

function asQuestion(raw: unknown): StoredQuestion | null {
  const q = raw as Partial<StoredQuestion> | null;
  if (
    !q ||
    typeof q.question !== "string" ||
    !Array.isArray(q.options) ||
    q.options.length < 2 ||
    q.options.some((o) => typeof o !== "string") ||
    typeof q.correctIndex !== "number" ||
    q.correctIndex < 0 ||
    q.correctIndex >= q.options.length
  ) {
    return null;
  }
  return {
    question: q.question,
    options: q.options as string[],
    correctIndex: q.correctIndex,
    explanation: typeof q.explanation === "string" ? q.explanation : "",
  };
}

/**
 * Walk attempts newest-first and keep, per key, only the most recent time the
 * learner saw that question. It is a mistake when that latest answer was
 * wrong (answering it right in a later quiz clears it) and the key has not
 * been fixed through review. Result is newest-first.
 */
export function collectMistakes(attempts: AttemptLike[], fixedKeys: ReadonlySet<string>): Mistake[] {
  const sorted = [...attempts].sort((a, b) => b.attemptedAt.getTime() - a.attemptedAt.getTime());
  const seen = new Set<string>();
  const out: Mistake[] = [];

  for (const a of sorted) {
    const questions = Array.isArray(a.questions) ? a.questions : [];
    const answers = Array.isArray(a.userAnswers) ? (a.userAnswers as unknown[]) : [];
    questions.forEach((raw, i) => {
      const q = asQuestion(raw);
      if (!q) return;
      const key = reviewKey(a.topicId, q.question);
      if (seen.has(key)) return;
      seen.add(key);
      const selected = typeof answers[i] === "number" ? (answers[i] as number) : -1;
      if (selected === q.correctIndex) return;
      if (fixedKeys.has(key)) return;
      out.push({ ...q, key, topicId: a.topicId, selectedIndex: selected, attemptedAt: a.attemptedAt });
    });
  }
  return out;
}
