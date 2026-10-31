import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { complete } from "./llm.service";
import { remember, del } from "./cache.service";
import { getLessonImage, type LessonImage } from "./lessonMedia.service";
import { recordTopicComplete, type GamificationDelta } from "./gamification.service";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

const TOPIC_PUBLIC = {
  id: true,
  orderIndex: true,
  title: true,
  summary: true,
  difficulty: true,
  phase: true,
  roadmap: {
    select: {
      id: true,
      title: true,
      domain: {
        select: { id: true, slug: true, name: true, color: true, icon: true },
      },
    },
  },
} as const;

// Per planning doc §9.5: cache common explanations 30 days.
const EXPLANATION_TTL_SECONDS = 30 * 24 * 60 * 60;

const SYSTEM_PROMPT = `You are SkillStreak AI, an expert teacher writing ONE lesson inside a structured course. Your goal: the learner finishes the lesson genuinely understanding this one concept, in the context of the course they are taking.

ANCHORING (most important)
- You are given the course (domain + roadmap), the lesson's position, the topics the learner has just finished, and the topics coming next. Teach THIS topic as the next step of THAT course.
- Every example, analogy, scenario, command and diagram must come from the course's domain. Example: "Hashing" in a Cybersecurity course is about password storage, file integrity and signatures, not generic hash tables; "State" in a Web Development course is about UI state in a web app, not US states.
- Build on the previous topics: you may refer to them by name, but don't re-teach them. Don't teach the upcoming topics yet; at most name them as what comes next.
- Pitch depth to the stated lesson level and learner background. When the learner is less experienced than the lesson level, add scaffolding: define more terms, smaller steps, one extra sentence of "why".

VOICE
- Plain, precise English. Second person ("you"), active voice, short sentences. Define every technical term the first time you use it, in a few words.
- Be correct. Pick one framing and stay consistent. No filler ("essentially", "basically", "in today's world"), no hype, no "I hope this helps".

STRUCTURE: output Markdown with exactly these \`##\` headings, in this order:

## The big idea
2–3 sentences: what it is and why it matters, in plain words.

## Explained simply
One vivid analogy from everyday life, then one or two sentences on where the analogy breaks down.

## How it works
The mechanism, step by step. Numbered steps or short paragraphs. Bold each key term on first use and define it. Include a fenced code block (with a language hint) only where it truly helps.

## See it
One sentence introducing the diagram, then EXACTLY ONE Mermaid diagram in a \`\`\`mermaid fenced block showing the architecture, flow, sequence or layers of THIS concept (not a generic diagram). Follow the MERMAID RULES strictly.

## Worked example
A concrete, realistic example from the domain, walked through end to end with real values, commands, code or output.

## Common mistakes
3–4 bullets, each: **the mistake** → the fix.

## Where it fits
1–2 sentences linking back to the previous topics and forward to the next ones, by name.

## Check yourself
Exactly 3 short questions as a numbered list. Directly after each question, on its own lines, put its answer in this exact form:
<details><summary>Answer</summary>
One to three sentences.
</details>

## Key takeaways
Exactly 4 bullets, one sentence each.

MERMAID RULES (the diagram is rendered by a strict parser; invalid syntax shows nothing)
- First line must be one of: \`flowchart TD\`, \`flowchart LR\`, \`sequenceDiagram\`, \`classDiagram\`.
- Node ids are simple alphanumerics with no spaces (A, B1, client, db).
- In flowcharts put every label in double quotes, e.g. A["Web browser"] -->|"HTTPS request"| B["Load balancer"]. Use the ["..."] node shape (decisions may use {"..."}).
- Inside labels: no double quotes, no parentheses, no semicolons, no brackets, no HTML, no emoji, no line breaks. Keep labels under 6 words.
- sequenceDiagram: declare \`participant C as Client\` lines first; messages look like \`C->>S: Sends login request\` (no quotes, no semicolons, no extra colons in the message text).
- classDiagram: plain class names, members like \`+String name\` and \`+login()\`, relations like \`User --> Session\`.
- At most 12 nodes. No style, classDef, linkStyle, click, comments, %% directives, or subgraphs.

LENGTH
- 700–1200 words total (excluding the diagram). Tight, not padded.

FINAL LINE
After the Key takeaways, end with exactly one final line:
IMAGE_TOPIC: <the exact English Wikipedia article title that best illustrates this concept with a real photo or diagram, e.g. "Public-key cryptography", "Load balancing (computing)", "Raspberry Pi">`;

const PHASE_LEVEL: Record<string, string> = {
  foundations: "Beginner",
  core: "Intermediate",
  advanced: "Advanced",
};

function priorLevelToSkillLevel(priorLevel: string | undefined | null): SkillLevel {
  if (priorLevel === "experienced") return "advanced";
  if (priorLevel === "some") return "intermediate";
  return "beginner";
}

// Static topic metadata (title, summary, domain) — only changes on admin edit,
// so it's cached. Invalidated by invalidateTopicMeta().
const TOPIC_META_TTL_SECONDS = 300;

async function getTopicMeta(topicId: string) {
  const { value } = await remember(`topic:${topicId}:meta`, TOPIC_META_TTL_SECONDS, async () => {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: TOPIC_PUBLIC,
    });
    if (!topic) throw new ApiError(404, "Topic not found");
    return topic;
  });
  return value;
}

/** Drop cached topic metadata after an admin edit/delete. */
export async function invalidateTopicMeta(topicId: string): Promise<void> {
  await del(`topic:${topicId}:meta`);
}

export async function getTopicForUser(topicId: string, userId: string) {
  // Static metadata (cached) and per-user progress are independent — fetch both
  // at once so a cache hit costs a single progress round-trip.
  const [topic, progress] = await Promise.all([
    getTopicMeta(topicId),
    prisma.userProgress.findUnique({
      where: { userId_topicId: { userId, topicId } },
      select: {
        status: true,
        bestScore: true,
        completedAt: true,
        timeSpentSeconds: true,
      },
    }),
  ]);

  return { ...topic, progress };
}

const IMAGE_TOPIC_RE = /^[ \t>*_`]*IMAGE[_ ]TOPIC\s*:\s*(.+?)[ \t*_`]*$/im;

/**
 * Strips the trailing IMAGE_TOPIC line (returned separately) and repairs the
 * most common Mermaid mistakes LLMs make, so the diagram parses on the client.
 */
export function postProcessLesson(raw: string): { explanation: string; imageTopic: string } {
  let text = raw.replace(/\r\n/g, "\n").trim();
  // Some models wrap the whole answer in a ```markdown fence.
  const wrapped = text.match(/^```(?:markdown|md)?\n([\s\S]*)\n```$/);
  if (wrapped) text = wrapped[1].trim();

  let imageTopic = "";
  const m = text.match(IMAGE_TOPIC_RE);
  if (m) {
    imageTopic = m[1].replace(/^["'<\s]+|["'>.\s]+$/g, "").trim();
    text = text.replace(IMAGE_TOPIC_RE, "");
  }
  // Belt and braces: never leak the marker, wherever it ended up.
  text = text.replace(/^.*IMAGE[_ ]TOPIC\s*:.*$/gim, "");
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  text = text.replace(/```mermaid[ \t]*\n([\s\S]*?)```/g, (_all, body: string) => {
    return "```mermaid\n" + sanitizeMermaid(body) + "\n```";
  });

  return { explanation: text, imageTopic };
}

function cleanLabel(label: string): string {
  return label
    .trim()
    .replace(/^"+|"+$/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/["`]/g, "'")
    .replace(/[();[\]{}|]/g, " ")
    .replace(/#/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const SHAPE_PAIRS: Record<string, string> = {
  "([": "])",
  "[(": ")]",
  "((": "))",
  "[[": "]]",
  "{{": "}}",
  "[": "]",
  "(": ")",
  "{": "}",
};

// id + opening bracket + label (lazy) + closing bracket, followed by something
// that can legally follow a node: end of line, an edge, `&`, or `:::`.
const NODE_RE =
  /\b([A-Za-z_][\w]*)(\(\[|\[\(|\(\(|\[\[|\{\{|\[|\(|\{)(.*?)(\]\)|\)\]|\)\)|\]\]|\}\}|\]|\)|\})(?=\s*(?:$|[-=.~<ox]*-[-.>]|==|&|:::))/g;

/** Best-effort repair of LLM-written Mermaid. Leaves unknown diagram types alone. */
export function sanitizeMermaid(src: string): string {
  const lines = src
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l) => l.trim() && !l.trim().startsWith("%%"));
  if (lines.length === 0) return src.trim();

  let header = lines[0].trim().replace(/;$/, "");
  if (/^graph\s+(TD|TB|LR|RL|BT)$/i.test(header)) header = header.replace(/^graph/i, "flowchart");
  const isFlow = /^flowchart\b/i.test(header);
  const isSeq = /^sequenceDiagram\b/.test(header);
  const hasSubgraph = lines.some((l) => /^\s*subgraph\b/.test(l));

  const body = lines.slice(1).flatMap((line) => {
    const trimmed = line.trim();
    if (/^(style|classDef|linkStyle|click)\b/.test(trimmed)) return [];
    if (isFlow && /^class\s/.test(trimmed)) return [];
    let out = line.replace(/;\s*$/, "");

    if (isFlow) {
      // 1. Edge labels -->|text|  → placeholders, so node matching can't touch them.
      const edges: string[] = [];
      out = out.replace(/\|([^|]*)\|/g, (_all, label: string) => {
        edges.push(`|"${cleanLabel(label)}"|`);
        return `\u0000${edges.length - 1}\u0000`;
      });
      // 2. Node labels → always quoted and cleaned.
      out = out.replace(NODE_RE, (_all, id: string, open: string, label: string, close: string) => {
        const want = SHAPE_PAIRS[open] ?? "]";
        const text = cleanLabel(label);
        return want === close ? `${id}${open}"${text}"${want}` : `${id}["${text}"]`;
      });
      // 3. `end` is a reserved word in flowcharts; rename it when used as a node id.
      if (!hasSubgraph) {
        out = out
          .split('"')
          .map((seg, i) => (i % 2 === 0 ? seg.replace(/\bend\b/g, "endNode") : seg))
          .join('"');
      }
      out = out.replace(/\u0000(\d+)\u0000/g, (_all, i: string) => edges[Number(i)]);
      // `A -- text --> B` with punctuation in text: quote it.
      out = out.replace(/--\s+([^">|-][^>|]*?)\s+-->/g, (_all, label: string) => `-->|"${cleanLabel(label)}"|`);
    } else if (isSeq) {
      out = out.replace(
        /^(\s*[\w]+\s*[-.]+[>x)]+[+-]?\s*[\w]+\s*:)(.*)$/,
        (_all, head: string, msg: string) =>
          head + " " + msg.replace(/[;#]/g, " ").replace(/<[^>]+>/g, "").replace(/\s{2,}/g, " ").trim()
      );
      out = out.replace(/^(\s*(?:Note\s+\w+(?:\s+of)?\s+[\w,]+\s*:))(.*)$/, (_all, head: string, msg: string) =>
        head + " " + msg.replace(/[;#]/g, " ").replace(/<[^>]+>/g, "").trim()
      );
    }
    return [out];
  });

  return [header, ...body].join("\n");
}

type CurriculumContext = {
  domainName: string;
  roadmapTitle: string;
  position: number;
  total: number;
  previous: string[];
  next: string[];
};

async function getCurriculumContext(roadmapId: string, orderIndex: number): Promise<CurriculumContext> {
  const { value } = await remember(`roadmap:${roadmapId}:outline`, TOPIC_META_TTL_SECONDS, async () => {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
      select: {
        title: true,
        domain: { select: { name: true } },
        topics: { select: { orderIndex: true, title: true }, orderBy: { orderIndex: "asc" } },
      },
    });
    return {
      domainName: roadmap?.domain.name ?? "",
      roadmapTitle: roadmap?.title ?? "",
      topics: roadmap?.topics ?? [],
    };
  });
  const idx = value.topics.findIndex((t) => t.orderIndex === orderIndex);
  return {
    domainName: value.domainName,
    roadmapTitle: value.roadmapTitle,
    position: idx + 1,
    total: value.topics.length,
    previous: idx > 0 ? value.topics.slice(Math.max(0, idx - 3), idx).map((t) => t.title) : [],
    next: idx >= 0 ? value.topics.slice(idx + 1, idx + 3).map((t) => t.title) : [],
  };
}

const LEARNER_BACKGROUND: Record<SkillLevel, string> = {
  beginner: "new to this field (little or no prior experience)",
  intermediate: "has some prior experience in this field",
  advanced: "experienced in this field",
};

const LEVEL_RANK: Record<string, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

export async function explainTopic(
  topicId: string,
  userId: string,
  opts: { fresh?: boolean } = {}
): Promise<{ explanation: string; level: SkillLevel; cached: boolean; image: LessonImage | null }> {
  const [topic, profile] = await Promise.all([
    prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, title: true, summary: true, phase: true, orderIndex: true, roadmapId: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: { priorLevel: true },
    }),
  ]);

  if (!topic) throw new ApiError(404, "Topic not found");
  const level = priorLevelToSkillLevel(profile?.priorLevel);
  const ctx = await getCurriculumContext(topic.roadmapId, topic.orderIndex);

  // Depth comes from the topic's phase, nudged by the learner's background.
  const lessonLevel = PHASE_LEVEL[topic.phase] ?? "Intermediate";
  const gap = LEVEL_RANK[level] - LEVEL_RANK[lessonLevel];
  const nudge =
    gap < 0
      ? "They are less experienced than this lesson's level: add extra scaffolding (define more terms, use smaller steps, recap in one sentence the prerequisite idea they need)."
      : gap > 0
        ? "They are more experienced than this lesson's level: keep it brisk, skip the obvious, and add one deeper nuance or real-world gotcha."
        : "They match this lesson's level.";

  const list = (items: string[]) => (items.length ? items.map((t) => `- ${t}`).join("\n") : "- (none: this is the start of the roadmap)");
  const nextList = (items: string[]) => (items.length ? items.map((t) => `- ${t}`).join("\n") : "- (none: this is the final lesson)");

  // v3: curriculum-anchored lessons with a diagram + image topic. The prompt is
  // fully determined by the topic (its roadmap neighbours) and the learner level.
  const cacheKey = `topic:${topic.id}:level:${level}:v3`;
  // "Regenerate": drop the shared cached lesson so this request writes a new one.
  if (opts.fresh) await del(cacheKey);
  const userPrompt = `COURSE
Domain: ${ctx.domainName}
Roadmap: ${ctx.roadmapTitle}
This lesson: "${topic.title}" (lesson ${ctx.position} of ${ctx.total})
Lesson summary (context only, don't quote it): ${topic.summary}
Lesson level: ${lessonLevel} (${topic.phase} phase)
Learner background: ${LEARNER_BACKGROUND[level]}. ${nudge}

What the learner has just learned (build on it, don't re-teach it):
${list(ctx.previous)}

What this prepares them for (don't teach it yet):
${nextList(ctx.next)}

Write the lesson on "${topic.title}" for this ${ctx.domainName} course, following the system prompt exactly. Every example, analogy and the diagram must fit ${ctx.domainName}. End with the IMAGE_TOPIC line.`;

  const { value, cached } = await remember<{ explanation: string; imageTopic: string }>(
    cacheKey,
    EXPLANATION_TTL_SECONDS,
    async () => {
      const text = await complete({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.35,
        maxTokens: 3200,
      });
      return postProcessLesson(text);
    }
  );

  // Runs after generation; the result is cached for 30 days, so cache hits cost
  // one Redis read. A missing IMAGE_TOPIC falls back to the topic title.
  const image = await getLessonImage(value.imageTopic || topic.title, `${ctx.domainName} ${topic.title}`);

  return { explanation: value.explanation, level, cached, image };
}

export async function markTopicComplete(topicId: string, userId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true },
  });
  if (!topic) throw new ApiError(404, "Topic not found");

  // Was this already completed? If so, skip gamification (no double-award).
  const existing = await prisma.userProgress.findUnique({
    where: { userId_topicId: { userId, topicId } },
    select: { status: true },
  });
  const wasAlreadyComplete = existing?.status === "completed";

  const progress = await prisma.userProgress.upsert({
    where: { userId_topicId: { userId, topicId } },
    create: {
      userId,
      topicId,
      status: "completed",
      completedAt: new Date(),
    },
    update: {
      status: "completed",
      completedAt: new Date(),
    },
    select: {
      status: true,
      completedAt: true,
      bestScore: true,
      timeSpentSeconds: true,
    },
  });

  const gamification: GamificationDelta | null = wasAlreadyComplete
    ? null
    : await recordTopicComplete(userId, { topicId });

  return { progress, gamification };
}
