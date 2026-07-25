/**
 * Personalized onboarding — the AI-mentor assessment a learner takes when
 * they enter a domain, and the personalized phased roadmap generated from it.
 *
 * Flow:
 *  1. GET  questions  — conversational question set (domain-aware options,
 *     known-topic chips pulled from the curated roadmap).
 *  2. POST answers    — one LLM call builds { learner profile, phased plan,
 *     capstone project with step-by-step guide, week-1 daily schedule } and
 *     stores it on the DomainAssessment row (one per user+domain).
 *  3. GET  plan       — stored plan + live adaptive tips computed from the
 *     learner's quiz history in this domain (<70% → revise, >90% → skip).
 */

import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { complete } from "./llm.service";
import { log } from "../utils/logger.util";

// ─── Answer + plan shapes ───────────────────────────────────────────────

export type AssessmentAnswers = {
  why: string;                  // job | college | hackathons | freelancing | curiosity | switch
  level: string;                // beginner | basic | intermediate | advanced
  learnedBefore: boolean;
  knownTopics: string[];        // curated topic titles the learner already knows
  dailyMinutes: number;         // 15 | 30 | 60 | 120
  style: string;                // videos | reading | labs | mix
  mode: string;                 // roadmap | challenges | projects | build
  endGoal: string;              // domain-specific role
  wantsCert: boolean;
  certification: string | null;
  languages: string[];
  os: string;                   // windows | linux | macos
};

export type LearnerProfile = {
  level: string;
  goal: string;
  dailyMinutes: number;
  style: string;
  mode: string;
  os: string;
  languages: string[];
  certification: string | null;
  strengths: string[];
  weaknesses: string[];
  estimatedWeeks: number;
  pace: "relaxed" | "moderate" | "aggressive";
  summary: string;              // 2-3 sentence mentor note
};

export type PlanResource = { title: string; url?: string; query?: string };

export type PlanPhase = {
  n: number;
  title: string;
  objective: string;
  days: number;
  topics: string[];
  why: string;                  // beginner-friendly explanation of the phase
  resources: {
    videos: PlanResource[];
    docs: PlanResource[];
    courses: PlanResource[];
    practice: PlanResource[];
  };
  exercises: string[];
  miniProject: { title: string; brief: string; steps: string[] };
  milestone: string;
};

export type CapstoneProject = {
  title: string;
  brief: string;
  steps: string[];              // complete step-by-step build guide
  deliverables: string[];
  showoff: string;              // how to present it (resume / GitHub / demo)
};

export type Week1Day = {
  day: number;
  focus: string;
  watch: string;
  read: string;
  practice: string;
  quiz: string;
};

export type PersonalizedPlan = {
  phases: PlanPhase[];
  capstone: CapstoneProject;
  week1: Week1Day[];
};

export type AdaptiveTips = {
  weakTopics: Array<{ title: string; bestScore: number }>;
  strongTopics: string[];
  advice: string | null;
};

// ─── Question set ───────────────────────────────────────────────────────

type QuestionOption = { value: string; label: string; hint?: string };

export type AssessmentQuestion = {
  id: keyof AssessmentAnswers | "certification" | "knownTopics" | "languages";
  prompt: string;               // what the mentor "says"
  type: "single" | "multi" | "boolean";
  options: QuestionOption[];
  dependsOn?: { id: string; value: unknown }; // show only when prior answer matches
};

const ROLE_GOALS: Array<{ match: RegExp; roles: string[] }> = [
  { match: /cyber|security|hack/i, roles: ["SOC Analyst", "Penetration Tester", "Bug Bounty Hunter", "Security Engineer"] },
  { match: /artificial|^ai$|ml|machine/i, roles: ["AI Engineer", "ML Engineer", "LLM Developer", "Data Scientist"] },
  { match: /cloud/i, roles: ["AWS Engineer", "Azure Engineer", "Cloud Architect", "DevOps Engineer"] },
  { match: /devops/i, roles: ["DevOps Engineer", "Site Reliability Engineer", "Platform Engineer", "Cloud Engineer"] },
  { match: /data/i, roles: ["Data Analyst", "Data Scientist", "Data Engineer", "ML Engineer"] },
  { match: /web/i, roles: ["Frontend Developer", "Backend Developer", "Full-stack Developer", "Freelance Web Dev"] },
  { match: /blockchain|web3/i, roles: ["Smart Contract Developer", "Blockchain Engineer", "Web3 Full-stack Dev", "Security Auditor"] },
  { match: /iot|internet of things/i, roles: ["IoT Developer", "Embedded Engineer", "IoT Solutions Architect", "Firmware Engineer"] },
];

const CERT_OPTIONS: Array<{ match: RegExp; certs: string[] }> = [
  { match: /cyber|security|hack/i, certs: ["CompTIA Security+", "CEH", "eJPT", "OSCP"] },
  { match: /cloud/i, certs: ["AWS Cloud Practitioner", "AWS Solutions Architect", "Azure AZ-900", "GCP ACE"] },
  { match: /devops/i, certs: ["CKA (Kubernetes)", "Terraform Associate", "AWS DevOps Pro", "Docker DCA"] },
  { match: /data|ai|ml|machine|artificial/i, certs: ["TensorFlow Developer", "AWS ML Specialty", "Databricks Cert", "Google Data Analytics"] },
  { match: /web/i, certs: ["Meta Front-End Cert", "AWS Cloud Practitioner", "freeCodeCamp Certs"] },
];

function rolesFor(domainName: string): string[] {
  return ROLE_GOALS.find((r) => r.match.test(domainName))?.roles
    ?? ["Software Engineer", "Specialist in this domain", "Freelancer", "Researcher"];
}

function certsFor(domainName: string): string[] {
  return CERT_OPTIONS.find((c) => c.match.test(domainName))?.certs ?? ["A well-known cert in this field"];
}

export async function getAssessmentQuestions(slug: string) {
  const domain = await prisma.domain.findUnique({
    where: { slug },
    select: {
      id: true, name: true, slug: true,
      roadmap: { select: { topics: { select: { title: true }, orderBy: { orderIndex: "asc" }, take: 14 } } },
    },
  });
  if (!domain) throw new ApiError(404, "Domain not found");

  const topicChips = domain.roadmap?.topics.map((t) => t.title) ?? [];

  const questions: AssessmentQuestion[] = [
    {
      id: "why",
      prompt: `Why do you want to learn ${domain.name}?`,
      type: "single",
      options: [
        { value: "job", label: "Get a job" },
        { value: "college", label: "College project" },
        { value: "hackathons", label: "Hackathons" },
        { value: "freelancing", label: "Freelancing" },
        { value: "curiosity", label: "Curiosity" },
        { value: "switch", label: "Career switch" },
      ],
    },
    {
      id: "level",
      prompt: "How much do you already know here?",
      type: "single",
      options: [
        { value: "beginner", label: "Complete beginner", hint: "Starting from zero" },
        { value: "basic", label: "Basic", hint: "I know some terms" },
        { value: "intermediate", label: "Intermediate", hint: "I've built / done things" },
        { value: "advanced", label: "Advanced", hint: "I want depth + gaps filled" },
      ],
    },
    {
      id: "learnedBefore",
      prompt: "Have you tried learning this before?",
      type: "boolean",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No, first time" },
      ],
    },
    {
      id: "knownTopics",
      prompt: "Nice — tap everything you already know:",
      type: "multi",
      dependsOn: { id: "learnedBefore", value: true },
      options: topicChips.length
        ? topicChips.map((t) => ({ value: t, label: t }))
        : [{ value: "basics", label: "The basics" }, { value: "some-tools", label: "Some tools" }],
    },
    {
      id: "dailyMinutes",
      prompt: "How much time can you give this daily?",
      type: "single",
      options: [
        { value: "15", label: "15 mins", hint: "Slow burn" },
        { value: "30", label: "30 mins", hint: "Steady" },
        { value: "60", label: "1 hour", hint: "Serious" },
        { value: "120", label: "2+ hours", hint: "All in" },
      ],
    },
    {
      id: "style",
      prompt: "How do you learn best?",
      type: "single",
      options: [
        { value: "videos", label: "Videos" },
        { value: "reading", label: "Reading" },
        { value: "labs", label: "Hands-on labs" },
        { value: "mix", label: "Mix of everything" },
      ],
    },
    {
      id: "mode",
      prompt: "And what keeps you going?",
      type: "single",
      options: [
        { value: "roadmap", label: "A structured roadmap" },
        { value: "challenges", label: "Daily challenges" },
        { value: "projects", label: "Mini projects" },
        { value: "build", label: "Build while learning" },
      ],
    },
    {
      id: "endGoal",
      prompt: "Dream outcome — what's the end goal?",
      type: "single",
      options: rolesFor(domain.name).map((r) => ({ value: r, label: r })),
    },
    {
      id: "wantsCert",
      prompt: "Want me to fold certification prep into your plan?",
      type: "boolean",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "Not now" },
      ],
    },
    {
      id: "certification",
      prompt: "Which certification are you eyeing?",
      type: "single",
      dependsOn: { id: "wantsCert", value: true },
      options: certsFor(domain.name).map((c) => ({ value: c, label: c })),
    },
    {
      id: "languages",
      prompt: "Any programming languages under your belt?",
      type: "multi",
      options: [
        { value: "none", label: "None yet" },
        { value: "Python", label: "Python" },
        { value: "JavaScript", label: "JavaScript" },
        { value: "Java", label: "Java" },
        { value: "C/C++", label: "C / C++" },
        { value: "Go", label: "Go" },
        { value: "SQL", label: "SQL" },
      ],
    },
    {
      id: "os",
      prompt: "Last one — what do you run on?",
      type: "single",
      options: [
        { value: "windows", label: "Windows" },
        { value: "linux", label: "Linux" },
        { value: "macos", label: "macOS" },
      ],
    },
  ];

  return { domain: { name: domain.name, slug: domain.slug }, questions };
}

// ─── Generation ─────────────────────────────────────────────────────────

const SYSTEM = `You are an elite technical mentor and curriculum designer for SkillStreak AI. A learner just answered an onboarding assessment for one technology domain. Design their PERSONAL learning plan.

RULES OF PERSONALIZATION
- The plan must visibly react to their answers. Known topics → compress or skip (fold into a short "refresher"). Beginner + 15 min/day → fewer phases, gentler days. Advanced + 2h/day → deeper phases, faster estimate.
- Their end goal and certification (if any) shape the LAST phases (role-specific skills, cert syllabus).
- Their OS matters for tooling instructions (e.g. Linux users get native commands, Windows users get WSL notes).
- Their preferred style weights the resources (videos-first vs docs-first).
- Prerequisites they lack (e.g. no programming language for an AI goal) become an early phase.

RESOURCE LINK RULES — CRITICAL
- Never invent URLs. For "url" use ONLY famous, stable pages you are certain exist (official docs home pages, freeCodeCamp.org, roadmap.sh, tryhackme.com, kaggle.com, developer.mozilla.org, docs.python.org, aws.amazon.com/training, youtube channel home pages).
- For anything else, omit "url" and give "query" — a precise search phrase instead.

OUTPUT — return ONLY a JSON object, no markdown fences, exactly this shape:
{
  "profile": {
    "level": "beginner|basic|intermediate|advanced",
    "goal": "string", "dailyMinutes": 60, "style": "string", "mode": "string",
    "os": "string", "languages": ["string"], "certification": "string or null",
    "strengths": ["2-4 short strings based on their answers"],
    "weaknesses": ["2-4 short strings — gaps to close for their goal"],
    "estimatedWeeks": 16, "pace": "relaxed|moderate|aggressive",
    "summary": "2-3 sentences, mentor voice, addressed to the learner ('You...')"
  },
  "phases": [
    {
      "n": 1, "title": "string", "objective": "string (1 sentence)", "days": 14,
      "topics": ["3-6 concrete topics"],
      "why": "2-3 beginner-friendly sentences on why this phase exists for THEM",
      "resources": {
        "videos":  [{ "title": "string", "url": "https://… (only if certain)", "query": "search phrase" }],
        "docs":    [{ "title": "string", "url": "…", "query": "…" }],
        "courses": [{ "title": "string", "url": "…", "query": "…" }],
        "practice":[{ "title": "string", "url": "…", "query": "…" }]
      },
      "exercises": ["2-3 hands-on exercises with concrete outcomes"],
      "miniProject": { "title": "string", "brief": "1-2 sentences", "steps": ["4-7 numbered build steps"] },
      "milestone": "string — the test/checkpoint that proves this phase is done"
    }
  ],
  "capstone": {
    "title": "string — an impressive, goal-relevant final project",
    "brief": "2-3 sentences on what it is and why it impresses",
    "steps": ["10-14 COMPLETE step-by-step build instructions, concrete tools + commands, in order"],
    "deliverables": ["3-5 artifacts (repo, writeup, demo, dashboard…)"],
    "showoff": "2-3 sentences: how to present it on GitHub/resume/LinkedIn"
  },
  "week1": [
    { "day": 1, "focus": "string", "watch": "string", "read": "string", "practice": "string", "quiz": "string" }
  ]
}

VOLUME RULES
- 4 to 8 phases. Number them 1..N in order.
- 2-3 resources per resource list (videos/docs/courses/practice each).
- Exactly 7 entries in week1 (day 1..7), calibrated to their dailyMinutes.
- estimatedWeeks must be realistic for their dailyMinutes and the total phase days.`;

function stripJsonFences(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

export async function submitAssessment(slug: string, userId: string, answers: AssessmentAnswers) {
  const domain = await prisma.domain.findUnique({
    where: { slug },
    select: {
      id: true, name: true, slug: true, description: true,
      roadmap: { select: { topics: { select: { title: true }, orderBy: { orderIndex: "asc" } } } },
    },
  });
  if (!domain) throw new ApiError(404, "Domain not found");

  const curatedTitles = domain.roadmap?.topics.map((t) => t.title) ?? [];

  const raw = await complete({
    systemPrompt: SYSTEM,
    userPrompt: `Domain: ${domain.name}
Domain blurb: ${domain.description}
Curated topics that exist on our platform (ground topic names in these where sensible):
${curatedTitles.length ? curatedTitles.map((t) => `- ${t}`).join("\n") : "- (no curated roadmap)"}

Learner's assessment answers:
${JSON.stringify(answers, null, 2)}

Design the personalized plan JSON now.`,
    temperature: 0.45,
    maxTokens: 7000,
  });

  let parsed: { profile?: LearnerProfile; phases?: PlanPhase[]; capstone?: CapstoneProject; week1?: Week1Day[] };
  try {
    parsed = JSON.parse(stripJsonFences(raw));
  } catch {
    log.warn("personalization: invalid JSON from LLM", { slug, userId });
    throw new ApiError(502, "Plan generator returned invalid JSON — please try again");
  }
  if (!parsed?.profile || !Array.isArray(parsed.phases) || parsed.phases.length === 0 || !parsed.capstone) {
    throw new ApiError(502, "Plan generator returned an incomplete plan — please try again");
  }

  const profile = parsed.profile;
  const plan: PersonalizedPlan = {
    phases: parsed.phases,
    capstone: parsed.capstone,
    week1: Array.isArray(parsed.week1) ? parsed.week1 : [],
  };

  const row = await prisma.domainAssessment.upsert({
    where: { userId_domainId: { userId, domainId: domain.id } },
    create: { userId, domainId: domain.id, answers, profile, plan },
    update: { answers, profile, plan, planVersion: { increment: 1 } },
  });

  return { profile, plan, planVersion: row.planVersion, generatedAt: row.updatedAt };
}

// ─── Fetch + adaptive layer ─────────────────────────────────────────────

export async function getPlan(slug: string, userId: string) {
  const domain = await prisma.domain.findUnique({
    where: { slug },
    select: {
      id: true, name: true, slug: true,
      roadmap: { select: { topics: { select: { id: true, title: true } } } },
    },
  });
  if (!domain) throw new ApiError(404, "Domain not found");

  const row = await prisma.domainAssessment.findUnique({
    where: { userId_domainId: { userId, domainId: domain.id } },
  });
  if (!row) return { exists: false as const, domain: { name: domain.name, slug: domain.slug } };

  const adaptive = await computeAdaptiveTips(userId, domain.roadmap?.topics ?? []);

  return {
    exists: true as const,
    domain: { name: domain.name, slug: domain.slug },
    profile: row.profile as unknown as LearnerProfile,
    plan: row.plan as unknown as PersonalizedPlan,
    planVersion: row.planVersion,
    generatedAt: row.updatedAt,
    adaptive,
  };
}

/**
 * Live adaptive layer: read the learner's best quiz score per curated topic
 * in this domain. <70% (≤3/5) → recommend revision. >90% (5/5) → safe to
 * move faster. Recomputed on every plan fetch so it always reflects the
 * latest quiz results.
 */
async function computeAdaptiveTips(
  userId: string,
  topics: Array<{ id: string; title: string }>
): Promise<AdaptiveTips> {
  if (topics.length === 0) return { weakTopics: [], strongTopics: [], advice: null };

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId, topicId: { in: topics.map((t) => t.id) } },
    select: { topicId: true, score: true, total: true },
  });
  if (attempts.length === 0) return { weakTopics: [], strongTopics: [], advice: null };

  const bestByTopic = new Map<string, number>();
  for (const a of attempts) {
    const pct = Math.round((a.score / Math.max(1, a.total)) * 100);
    const prev = bestByTopic.get(a.topicId);
    if (prev === undefined || pct > prev) bestByTopic.set(a.topicId, pct);
  }

  const titleOf = new Map(topics.map((t) => [t.id, t.title]));
  const weakTopics: AdaptiveTips["weakTopics"] = [];
  const strongTopics: string[] = [];
  for (const [topicId, pct] of bestByTopic) {
    const title = titleOf.get(topicId);
    if (!title) continue;
    if (pct < 70) weakTopics.push({ title, bestScore: pct });
    else if (pct > 90) strongTopics.push(title);
  }

  let advice: string | null = null;
  if (weakTopics.length > 0) {
    advice = `Revise ${weakTopics[0].title}${weakTopics.length > 1 ? ` and ${weakTopics.length - 1} more topic${weakTopics.length > 2 ? "s" : ""}` : ""} before moving on — your quiz scores there are under 70%.`;
  } else if (strongTopics.length >= 2) {
    advice = `You're scoring above 90% on ${strongTopics.length} topics — feel free to skip ahead to the next phase.`;
  }

  return { weakTopics, strongTopics, advice };
}
