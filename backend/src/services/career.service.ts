/**
 * Career Path — a personalized "life roadmap" for a domain, unlocked as the
 * reward at the END of its roadmap: only once the learner has completed
 * every topic (same gate as interview prep, admin override included). The
 * trail they just finished literally leads into their career map.
 *
 * Personalized on three axes from UserProfile:
 *   priorLevel (none/some/experienced) → where the timeline starts
 *   goal (interview/awareness/curiosity) → what the stages emphasize
 *   pace (relaxed/standard/intense)     → how compressed the timeframes are
 *
 * Generation is expensive (~2500 tokens), so cache per
 * domain + level + goal + pace (27 personas per domain max, 30-day TTL).
 */

import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { complete } from "./llm.service";
import { remember } from "./cache.service";
import { isDomainCompleted, type InterviewGate } from "./interview.service";
import { log } from "../utils/logger.util";

const CAREER_TTL_SECONDS = 30 * 24 * 60 * 60;

export type CareerStage = {
  phase: number;              // 1..N, chronological
  title: string;              // "Foundations", "First internship", ...
  timeframe: string;          // "Months 0-3" — already pace-adjusted
  focus: string;              // what this stage is about, 2-3 sentences
  skills: string[];           // concrete skills/tools to acquire in this stage
  milestone: string;          // the "you know you're done when…" marker
};

export type CareerCertification = {
  name: string;               // "CompTIA Security+"
  org: string;                // "CompTIA"
  level: "foundation" | "intermediate" | "advanced" | "expert";
  whenToTake: string;         // "After stage 2, ~month 6"
  cost: string;               // realistic exam cost, e.g. "~$392 (₹33k)"
  whyItMatters: string;       // 1-2 sentences — what doors it opens
};

export type CareerRole = {
  title: string;              // "SOC Analyst (L1)"
  seniority: "entry" | "mid" | "senior" | "lead";
  salaryRange: string;        // Indian market, e.g. "₹4-7 LPA"
  whenReady: string;          // "From month 8, after Security+"
};

export type CareerProject = {
  title: string;
  description: string;        // 1-2 sentences, concrete deliverable
  skills: string[];           // what it proves
};

export type CareerPath = {
  domainSlug: string;
  domainName: string;
  persona: { level: string; goal: string; pace: string };
  headline: string;           // "From zero to Security Engineer in 30 months"
  summary: string;            // 2-3 personalized sentences
  stages: CareerStage[];      // 4-6 chronological career stages
  certifications: CareerCertification[]; // the cert ladder, cheapest→hardest
  roles: CareerRole[];        // job-title progression with Indian salaries
  projects: CareerProject[];  // portfolio projects that prove the skills
  firstSteps: string[];       // exactly 3 things to do THIS week
};

const SYSTEM = `You are a senior engineering-career mentor in India writing a personalized multi-year career roadmap for ONE tech domain the learner has committed to. This is their "life map" for the domain — from where they are today to a senior role.

THE LEARNER
- A final-year engineering student (or early-career) in India.
- Prior experience: "{level}" (none = absolute beginner, some = knows basics, experienced = can build things already).
- Main goal: "{goal}" (interview = wants a job/placement ASAP, awareness = wants employable breadth, curiosity = learning-first, career later).
- Pace: "{pace}" (relaxed ≈ 4-6 h/week, standard ≈ 1-1.5 h/day, intense ≈ 3+ h/day). COMPRESS or STRETCH every timeframe accordingly — an intense learner's "Months 0-3" is a relaxed learner's "Months 0-8".

RULES
- Real certifications only — real names, real orgs, realistic 2025 exam costs (give USD and approx ₹). Order them cheapest/easiest → hardest. Only certs that actually matter for hiring in this domain; skip vanity certs.
- Salary ranges are for the INDIAN market in LPA (₹). Be realistic, not inflated: entry roles in most domains are ₹3.5-8 LPA, not ₹20.
- If prior experience is "experienced", DO NOT start at absolute basics — stage 1 should assume fundamentals and start at the first gap a self-taught person typically has.
- If goal is "interview", the first 2 stages must be placement-oriented (projects + fundamentals interviewers actually probe). If "curiosity", bias stages toward building/exploring over credentialing.
- Concrete over generic: name real tools, real cert exam codes (e.g. SY0-701, SAA-C03), real role titles used on Indian job portals.
- Timeframes are cumulative and continuous ("Months 0-3", "Months 3-8", ...) with no gaps.

OUTPUT — return ONLY a JSON object, no Markdown fences, no commentary:

{
  "headline": "string — max 12 words, names the destination role and rough total timeline",
  "summary": "string — 2-3 sentences speaking directly to THIS persona (their level, goal and pace)",
  "stages": [
    { "phase": 1, "title": "string", "timeframe": "Months X-Y", "focus": "string (2-3 sentences)", "skills": ["string", ...], "milestone": "string — observable 'done when' marker" }
  ],
  "certifications": [
    { "name": "string", "org": "string", "level": "foundation"|"intermediate"|"advanced"|"expert", "whenToTake": "string", "cost": "string", "whyItMatters": "string" }
  ],
  "roles": [
    { "title": "string", "seniority": "entry"|"mid"|"senior"|"lead", "salaryRange": "₹X-Y LPA", "whenReady": "string" }
  ],
  "projects": [
    { "title": "string", "description": "string", "skills": ["string", ...] }
  ],
  "firstSteps": ["string", "string", "string"]
}

VOLUME RULES
- 5 stages (4 if experienced). Each with 4-6 skills.
- 4-5 certifications.
- 4 roles (entry → lead progression).
- 3 projects, ordered easiest → most impressive.
- Exactly 3 firstSteps — small, doable THIS week, each starting with a verb.`;

function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export async function getCareerPath(
  slug: string,
  userId: string
): Promise<{ career: CareerPath; cached: boolean; gate: InterviewGate }> {
  // Same completion gate as interview prep: the career map is the reward
  // waiting at the end of the roadmap, not a day-one handout.
  const gate = await isDomainCompleted(slug, userId);
  if (!gate.eligible) {
    throw new ApiError(403, "Complete every topic in this domain to unlock your career path");
  }

  const [domain, profile] = await Promise.all([
    prisma.domain.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true, description: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: { priorLevel: true, goal: true, pace: true },
    }),
  ]);
  if (!domain) throw new ApiError(404, "Domain not found");
  if (!profile) throw new ApiError(403, "Complete onboarding first");

  const { priorLevel, goal, pace } = profile;
  const cacheKey = `career:${domain.id}:${priorLevel}:${goal}:${pace}:v1`;

  const { value, cached } = await remember<{ career: CareerPath }>(
    cacheKey,
    CAREER_TTL_SECONDS,
    async () => {
      const raw = await complete({
        systemPrompt: SYSTEM.replace("{level}", priorLevel)
          .replace("{goal}", goal)
          .replace("{pace}", pace),
        userPrompt: `Domain: ${domain.name}
Domain blurb: ${domain.description}
Learner: level=${priorLevel}, goal=${goal}, pace=${pace}

Write the career-roadmap JSON.`,
        temperature: 0.5,
        maxTokens: 3000,
      });
      const cleaned = stripJsonFences(raw);
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new ApiError(502, "Career generator returned invalid JSON");
      }
      const career = validateAndShape(parsed, domain.slug, domain.name, {
        level: priorLevel,
        goal,
        pace,
      });
      return { career };
    }
  );

  return { career: value.career, cached, gate };
}

function validateAndShape(
  parsed: unknown,
  slug: string,
  name: string,
  persona: CareerPath["persona"]
): CareerPath {
  if (!parsed || typeof parsed !== "object") throw new ApiError(502, "Bad career JSON shape");
  const o = parsed as Record<string, unknown>;
  const career: CareerPath = {
    domainSlug: slug,
    domainName: name,
    persona,
    headline: typeof o.headline === "string" ? o.headline : `Your ${name} career path`,
    summary: typeof o.summary === "string" ? o.summary : "",
    stages: Array.isArray(o.stages) ? (o.stages as CareerStage[]) : [],
    certifications: Array.isArray(o.certifications)
      ? (o.certifications as CareerCertification[])
      : [],
    roles: Array.isArray(o.roles) ? (o.roles as CareerRole[]) : [],
    projects: Array.isArray(o.projects) ? (o.projects as CareerProject[]) : [],
    firstSteps: Array.isArray(o.firstSteps) ? (o.firstSteps as string[]) : [],
  };
  // A path without stages or certs is useless — treat as generation failure
  // so it isn't cached (remember() only caches successful results).
  if (career.stages.length === 0 || career.certifications.length === 0) {
    log.warn("career shape missing stages/certifications", { slug });
    throw new ApiError(502, "Career JSON shape invalid");
  }
  return career;
}
