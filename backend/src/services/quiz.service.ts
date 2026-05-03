import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { complete } from "./llm.service";
import { getJson, remember, setJson } from "./cache.service";
import { recordQuizSubmit, type GamificationDelta } from "./gamification.service";
import { SkillLevel } from "../prompts/system.prompt";
import {
  QUIZ_GENERATOR_SYSTEM,
  buildQuizUserPrompt,
  QUIZ_VALIDATOR_SYSTEM,
  buildQuizValidatorPrompt,
} from "../prompts/quiz.prompt";
import { log } from "../utils/logger.util";

export type QuizQuestion = {
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
};

export type Quiz = {
  topicId: string;
  level: SkillLevel;
  questions: QuizQuestion[];
};

// Public-facing question. Battleplan §4 calls for per-question reveal (green/red,
// inline explanation), so the correct answer ships with the question. Server still
// scores authoritatively on submit; this is a learning quiz, not an exam.
export type PublicQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

const QUIZ_TTL_SECONDS = 7 * 24 * 60 * 60; // battleplan §4.6
const PASS_THRESHOLD = 3;
const TOTAL_QUESTIONS = 5;

function priorLevelToSkillLevel(priorLevel: string | undefined | null): SkillLevel {
  if (priorLevel === "experienced") return "advanced";
  if (priorLevel === "some") return "intermediate";
  return "beginner";
}

function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function parseQuestions(raw: string): QuizQuestion[] {
  const cleaned = stripJsonFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ApiError(502, "Quiz generator returned invalid JSON");
  }

  const obj = parsed as { questions?: unknown };
  if (!obj || !Array.isArray(obj.questions)) {
    throw new ApiError(502, "Quiz JSON missing 'questions' array");
  }
  if (obj.questions.length !== TOTAL_QUESTIONS) {
    throw new ApiError(502, `Expected ${TOTAL_QUESTIONS} questions, got ${obj.questions.length}`);
  }

  const out: QuizQuestion[] = [];
  for (const q of obj.questions) {
    const qq = q as Partial<QuizQuestion> & { options?: unknown; correctIndex?: unknown };
    if (
      typeof qq.question !== "string" ||
      !Array.isArray(qq.options) ||
      qq.options.length !== 4 ||
      qq.options.some((o) => typeof o !== "string") ||
      typeof qq.correctIndex !== "number" ||
      qq.correctIndex < 0 ||
      qq.correctIndex > 3 ||
      typeof qq.explanation !== "string"
    ) {
      throw new ApiError(502, "Quiz question shape invalid");
    }
    out.push({
      question: qq.question,
      options: qq.options as [string, string, string, string],
      correctIndex: qq.correctIndex as 0 | 1 | 2 | 3,
      explanation: qq.explanation,
    });
  }
  return out;
}

async function validateQuestion(q: QuizQuestion): Promise<{ valid: boolean; reason?: string }> {
  try {
    const raw = await complete({
      systemPrompt: QUIZ_VALIDATOR_SYSTEM,
      userPrompt: buildQuizValidatorPrompt(q),
      temperature: 0,
      maxTokens: 80,
    });
    const cleaned = stripJsonFences(raw);
    const parsed = JSON.parse(cleaned) as { valid?: unknown; reason?: unknown };
    return {
      valid: parsed.valid === true,
      reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
    };
  } catch (err) {
    log.warn("quiz validator parse failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    // Fail open: don't block on validator failures.
    return { valid: true };
  }
}

async function generateRaw(opts: {
  topic: { id: string; title: string; summary: string };
  level: SkillLevel;
  seed?: number;
}): Promise<QuizQuestion[]> {
  const raw = await complete({
    systemPrompt: QUIZ_GENERATOR_SYSTEM,
    userPrompt: buildQuizUserPrompt({
      topicTitle: opts.topic.title,
      topicSummary: opts.topic.summary,
      level: opts.level,
      seed: opts.seed,
    }),
    temperature: 0.6,
    maxTokens: 1200,
  });
  return parseQuestions(raw);
}

async function generateAndValidate(opts: {
  topic: { id: string; title: string; summary: string };
  level: SkillLevel;
  seed?: number;
}): Promise<QuizQuestion[]> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const questions = await generateRaw({ ...opts, seed: opts.seed ?? attempt });
    const checks = await Promise.all(questions.map((q) => validateQuestion(q)));
    const failures = checks
      .map((c, i) => (c.valid ? null : { i, reason: c.reason }))
      .filter(Boolean);
    if (failures.length === 0) return questions;
    log.warn("quiz validation flagged questions", { attempt, failures });
    if (attempt === 2) return questions; // accept on second try; better than failing the user
  }
  throw new ApiError(502, "Could not generate a valid quiz");
}

/**
 * Generate (or retrieve cached) quiz for a topic + level. Optional `fresh` flag
 * skips the cache so retake gets a different quiz.
 */
export async function generateQuiz(opts: {
  topicId: string;
  userId: string;
  fresh?: boolean;
}): Promise<{ topicId: string; level: SkillLevel; questions: PublicQuestion[]; cached: boolean }> {
  const [topic, profile] = await Promise.all([
    prisma.topic.findUnique({
      where: { id: opts.topicId },
      select: { id: true, title: true, summary: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId: opts.userId },
      select: { priorLevel: true },
    }),
  ]);
  if (!topic) throw new ApiError(404, "Topic not found");
  const level = priorLevelToSkillLevel(profile?.priorLevel);

  const cacheKey = `quiz:${topic.id}:level:${level}`;

  if (opts.fresh) {
    const seed = Math.floor(Math.random() * 1_000_000);
    const questions = await generateAndValidate({ topic, level, seed });
    await setJson(cacheKey, { questions }, QUIZ_TTL_SECONDS);
    return {
      topicId: topic.id,
      level,
      cached: false,
      questions: questions.map(toPublic),
    };
  }

  const { value, cached } = await remember<{ questions: QuizQuestion[] }>(
    cacheKey,
    QUIZ_TTL_SECONDS,
    async () => {
      const questions = await generateAndValidate({ topic, level });
      return { questions };
    }
  );

  return {
    topicId: topic.id,
    level,
    cached,
    questions: value.questions.map(toPublic),
  };
}

function toPublic(q: QuizQuestion): PublicQuestion {
  return {
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  };
}

/**
 * Internal: fetch the cached/regenerated full quiz with answers (for grading).
 */
async function getFullQuiz(topicId: string, userId: string): Promise<Quiz> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { priorLevel: true },
  });
  const level = priorLevelToSkillLevel(profile?.priorLevel);
  const cacheKey = `quiz:${topicId}:level:${level}`;
  const hit = await getJson<{ questions: QuizQuestion[] }>(cacheKey);
  if (!hit) throw new ApiError(409, "Quiz expired or not generated. Generate a new one.");
  return { topicId, level, questions: hit.questions };
}

export async function submitAttempt(opts: {
  userId: string;
  topicId: string;
  answers: number[];
}) {
  if (opts.answers.length !== TOTAL_QUESTIONS) {
    throw new ApiError(400, `Expected ${TOTAL_QUESTIONS} answers, got ${opts.answers.length}`);
  }
  for (const a of opts.answers) {
    if (typeof a !== "number" || a < 0 || a > 3 || !Number.isInteger(a)) {
      throw new ApiError(400, "Answers must be integers 0..3");
    }
  }

  const quiz = await getFullQuiz(opts.topicId, opts.userId);

  let score = 0;
  const breakdown = quiz.questions.map((q, i) => {
    const selected = opts.answers[i];
    const correct = selected === q.correctIndex;
    if (correct) score++;
    return {
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      selectedIndex: selected,
      correct,
    };
  });

  const passed = score >= PASS_THRESHOLD;

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: opts.userId,
      topicId: opts.topicId,
      level: quiz.level,
      questions: quiz.questions as unknown as Prisma.InputJsonValue,
      userAnswers: opts.answers as unknown as Prisma.InputJsonValue,
      score,
      total: TOTAL_QUESTIONS,
      passed,
    },
    select: { id: true, score: true, total: true, passed: true, attemptedAt: true },
  });

  const existing = await prisma.userProgress.findUnique({
    where: { userId_topicId: { userId: opts.userId, topicId: opts.topicId } },
    select: { bestScore: true, status: true },
  });
  const newBest = Math.max(score, existing?.bestScore ?? 0);

  if (passed) {
    await prisma.userProgress.upsert({
      where: { userId_topicId: { userId: opts.userId, topicId: opts.topicId } },
      create: {
        userId: opts.userId,
        topicId: opts.topicId,
        status: "completed",
        bestScore: newBest,
        completedAt: new Date(),
      },
      update: {
        status: "completed",
        bestScore: newBest,
        completedAt: new Date(),
      },
    });
  } else {
    // Don't downgrade an already-completed topic if a later attempt failed.
    const status = existing?.status === "completed" ? "completed" : "in_progress";
    await prisma.userProgress.upsert({
      where: { userId_topicId: { userId: opts.userId, topicId: opts.topicId } },
      create: {
        userId: opts.userId,
        topicId: opts.topicId,
        status: "in_progress",
        bestScore: score,
      },
      update: {
        status,
        bestScore: newBest,
      },
    });
  }

  // Award XP / streak / badges. If this attempt newly completes the topic
  // (was not_started or in_progress before, now completed via pass), the
  // gamification call here covers the +10 streak bonus and quiz XP. The
  // separate "Mark complete" button awards topic_complete XP via
  // topic.service.markTopicComplete; we don't double-award.
  let gamification: GamificationDelta | null = null;
  try {
    gamification = await recordQuizSubmit(opts.userId, {
      topicId: opts.topicId,
      score,
      total: TOTAL_QUESTIONS,
      passed,
    });
  } catch (err) {
    // Don't break the quiz response if gamification fails.
    log.warn("recordQuizSubmit failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { attempt, breakdown, passed, score, total: TOTAL_QUESTIONS, gamification };
}

export async function getHistory(userId: string) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { attemptedAt: "desc" },
    take: 50,
    select: {
      id: true,
      topicId: true,
      level: true,
      score: true,
      total: true,
      passed: true,
      attemptedAt: true,
      topic: { select: { title: true, roadmap: { select: { domain: { select: { slug: true, name: true } } } } } },
    },
  });
  return attempts.map((a) => ({
    id: a.id,
    topicId: a.topicId,
    topicTitle: a.topic.title,
    domain: a.topic.roadmap.domain,
    level: a.level,
    score: a.score,
    total: a.total,
    passed: a.passed,
    attemptedAt: a.attemptedAt,
  }));
}
