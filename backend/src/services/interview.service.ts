/**
 * Interview Prep — generated once a user has completed every topic in a
 * curated domain. The output is meant to make them stand out: real
 * questions a senior engineer would actually ask, plus system-design
 * scenarios, behavioral STAR prompts, signature differentiators, common
 * pitfalls, and a 7-day study plan.
 *
 * Generation is expensive (~2000 tokens), so we cache aggressively per
 * domain + level (30 days).
 */

import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { complete } from "./llm.service";
import { remember } from "./cache.service";
import { SkillLevel } from "../prompts/system.prompt";
import { log } from "../utils/logger.util";

const INTERVIEW_TTL_SECONDS = 30 * 24 * 60 * 60;

export type InterviewQuestion = {
  q: string;
  category: "concept" | "system-design" | "behavioral" | "code" | "trap";
  difficulty: "easy" | "medium" | "hard";
  answer: string;       // model answer, markdown
  whyAsked: string;     // what the interviewer is really checking
  starAnswer?: string;  // for behavioral: STAR-formatted suggestion
};

export type InterviewPrep = {
  domainSlug: string;
  domainName: string;
  level: SkillLevel;
  // High-level talking points the candidate should be able to riff on
  pillars: Array<{ title: string; oneLiner: string }>;
  // Things candidates almost always get wrong — pre-empting them is a flex
  pitfalls: string[];
  // 6–10 things that make a candidate look senior
  differentiators: string[];
  // 12–18 real interview questions across categories + difficulties
  questions: InterviewQuestion[];
  // 1–2 architecture scenarios with a model solution outline
  systemDesign: Array<{ scenario: string; solutionOutline: string; followUps: string[] }>;
  // 7-day cram plan (one task per day)
  weekPlan: Array<{ day: number; focus: string; deliverable: string }>;
  // Books / talks / repos / blogs worth bookmarking
  resources: Array<{ title: string; type: "book" | "talk" | "repo" | "blog" | "docs"; url?: string }>;
};

const SYSTEM = `You are a hiring manager + technical interviewer for senior engineering roles writing a "stand out from the crowd" interview-prep brief for a learner who has just finished a curated roadmap on this domain.

VOICE
- You've sat on the other side of the table. You know the exact answers that signal "this person actually gets it" vs "they memorised a list".
- Concrete and specific. Name real tools, real protocols, real numbers. No vague platitudes.
- Tough but motivating.

THE LEARNER
- Has completed every topic in the curated roadmap for this domain.
- Skill level is "{level}". Calibrate question difficulty accordingly.
- Goal: be in the top 5% of candidates in the interview room for this domain.

OUTPUT — return ONLY a JSON object with this exact shape, no Markdown fences, no commentary:

{
  "pillars": [ { "title": "string", "oneLiner": "string (max 18 words)" } ],
  "pitfalls": [ "string" ],
  "differentiators": [ "string" ],
  "questions": [
    {
      "q": "string — the question, phrased exactly as an interviewer would say it",
      "category": "concept" | "system-design" | "behavioral" | "code" | "trap",
      "difficulty": "easy" | "medium" | "hard",
      "answer": "string — markdown, 4-8 sentences. Be specific. For 'code' include a short fenced code block.",
      "whyAsked": "string — 1-2 sentences explaining what the interviewer is really probing for",
      "starAnswer": "string — ONLY for behavioral, an outline using Situation / Task / Action / Result"
    }
  ],
  "systemDesign": [
    {
      "scenario": "string — realistic scenario the learner could be asked to design",
      "solutionOutline": "string — markdown, named components + key tradeoffs (8-14 sentences)",
      "followUps": [ "string (deeper question the interviewer would ask)" ]
    }
  ],
  "weekPlan": [ { "day": 1, "focus": "string", "deliverable": "string" } ],
  "resources": [ { "title": "string", "type": "book"|"talk"|"repo"|"blog"|"docs", "url": "https://… (optional)" } ]
}

VOLUME RULES
- Exactly 5 pillars.
- Exactly 5 pitfalls.
- Exactly 8 differentiators.
- 15 questions total. Mix:
  * 5 concept (definitions, depth-of-understanding)
  * 4 system-design (scenarios — keep these to a one-line scenario in 'q' and put the meat in systemDesign separately)
    Actually — put system-design SCENARIOS in 'systemDesign'. The 4 "system-design" category questions here should be probing follow-up questions the interviewer asks about a design.
  * 3 behavioral (with STAR)
  * 2 code (real things a senior eng would ask)
  * 1 trap (deliberately ambiguous question; the answer is "I would clarify X first")
  * Across the 15: at least 4 hard, at most 4 easy.
- Exactly 2 systemDesign scenarios.
- Exactly 7 entries in weekPlan (day 1..7).
- 6-9 resources.

STYLE FOR ANSWERS
- Answer in your own voice. Don't say "great question".
- Anchor in concrete tools/numbers ("under 100ms p99", "RSA-2048", "Postgres' pg_stat_statements").
- If the topic has standard names for things (e.g. "thundering herd", "split-brain", "n+1 query"), USE them — interviewers love hearing the canonical name.
- For code answers, the fenced code block must be 8 lines or fewer and idiomatic.
- For behavioral, give a TEMPLATE answer (named placeholders like "[a small system you've built]") — the learner adapts it.`;

function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function priorLevelToSkillLevel(priorLevel: string | undefined | null): SkillLevel {
  if (priorLevel === "experienced") return "advanced";
  if (priorLevel === "some") return "intermediate";
  return "beginner";
}

/**
 * Returns true iff the user has marked every topic in the curated roadmap
 * for this domain as completed. Non-curated domains always return false.
 */
export async function isDomainCompleted(slug: string, userId: string): Promise<{
  eligible: boolean;
  completed: number;
  total: number;
}> {
  const domain = await prisma.domain.findUnique({
    where: { slug },
    select: { id: true, isCurated: true, roadmap: { select: { id: true, totalTopics: true, topics: { select: { id: true } } } } },
  });
  if (!domain) throw new ApiError(404, "Domain not found");
  if (!domain.isCurated || !domain.roadmap) return { eligible: false, completed: 0, total: 0 };
  const topicIds = domain.roadmap.topics.map((t) => t.id);
  if (topicIds.length === 0) return { eligible: false, completed: 0, total: 0 };
  const completed = await prisma.userProgress.count({
    where: { userId, topicId: { in: topicIds }, status: "completed" },
  });
  return { eligible: completed >= topicIds.length, completed, total: topicIds.length };
}

export async function getInterviewPrep(
  slug: string,
  userId: string
): Promise<{ prep: InterviewPrep; cached: boolean; gate: { eligible: boolean; completed: number; total: number } }> {
  const gate = await isDomainCompleted(slug, userId);
  if (!gate.eligible) {
    throw new ApiError(403, "Complete every topic in this domain to unlock interview prep");
  }

  const [domain, profile] = await Promise.all([
    prisma.domain.findUnique({ where: { slug }, select: { id: true, slug: true, name: true, description: true } }),
    prisma.userProfile.findUnique({ where: { userId }, select: { priorLevel: true } }),
  ]);
  if (!domain) throw new ApiError(404, "Domain not found");

  const level = priorLevelToSkillLevel(profile?.priorLevel);
  const cacheKey = `interview:${domain.id}:level:${level}:v1`;

  const { value, cached } = await remember<{ prep: InterviewPrep }>(
    cacheKey,
    INTERVIEW_TTL_SECONDS,
    async () => {
      const raw = await complete({
        systemPrompt: SYSTEM.replace("{level}", level),
        userPrompt: `Domain: ${domain.name}
Domain blurb: ${domain.description}
Learner level: ${level}

Write the interview-prep JSON.`,
        temperature: 0.5,
        maxTokens: 3500,
      });
      const cleaned = stripJsonFences(raw);
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new ApiError(502, "Interview generator returned invalid JSON");
      }
      const prep = validateAndShape(parsed, domain.slug, domain.name, level);
      return { prep };
    }
  );

  return { prep: value.prep, cached, gate };
}

function validateAndShape(parsed: unknown, slug: string, name: string, level: SkillLevel): InterviewPrep {
  if (!parsed || typeof parsed !== "object") throw new ApiError(502, "Bad interview JSON shape");
  const o = parsed as Record<string, unknown>;
  try {
    return {
      domainSlug: slug,
      domainName: name,
      level,
      pillars: (o.pillars as InterviewPrep["pillars"]) ?? [],
      pitfalls: (o.pitfalls as string[]) ?? [],
      differentiators: (o.differentiators as string[]) ?? [],
      questions: (o.questions as InterviewQuestion[]) ?? [],
      systemDesign: (o.systemDesign as InterviewPrep["systemDesign"]) ?? [],
      weekPlan: (o.weekPlan as InterviewPrep["weekPlan"]) ?? [],
      resources: (o.resources as InterviewPrep["resources"]) ?? [],
    };
  } catch (err) {
    log.warn("interview shape failed", { error: err instanceof Error ? err.message : String(err) });
    throw new ApiError(502, "Interview JSON shape invalid");
  }
}
