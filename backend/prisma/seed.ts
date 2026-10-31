/**
 * Seed: 9 domains, each with a curated beginner -> advanced roadmap
 * (~65 topics, Foundations -> Core -> Advanced).
 *
 * Idempotent — safe to re-run. Domains, roadmaps, and topics are upserted
 * by their natural keys (slug, domainId, (roadmapId, orderIndex)).
 *
 * Run with: `npm --workspace backend run db:seed`
 *
 * Topic order: each roadmap's sequence is defined in
 * prisma/curriculum/<slug>.json (see curriculum() below).
 */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Phase = "foundations" | "core" | "advanced";
type Difficulty = "easy" | "standard" | "hard";

type SeedTopic = {
  title: string;
  summary: string;
  phase: Phase;
};

type SeedDomain = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: "beginner" | "intermediate" | "mixed";
  isCurated: boolean;
  orderIndex: number;
  roadmap?: {
    title: string;
    estimatedDays: number;
    topics: SeedTopic[];
  };
};

// Each roadmap's topics live in prisma/curriculum/<slug>.json, in learning
// order (beginner -> advanced): the array index is the topic's order_index.
// `from` in those files records a topic's previous title; scripts/
// apply-curriculum.ts uses it to reorder an existing database in place.
function curriculum(slug: string): SeedTopic[] {
  const file = join(__dirname, "curriculum", `${slug}.json`);
  const data = JSON.parse(readFileSync(file, "utf8")) as { topics: (SeedTopic & { from?: string | null })[] };
  return data.topics.map(({ title, summary, phase }) => ({ title, summary, phase }));
}

// Difficulty rolls up from phase: foundations=easy, core=standard, advanced=hard.
const DIFFICULTY_BY_PHASE: Record<Phase, Difficulty> = {
  foundations: "easy",
  core: "standard",
  advanced: "hard",
};

const DOMAINS: SeedDomain[] = [
  {
    slug: "cybersecurity",
    name: "Cybersecurity",
    description:
      "Defend systems, networks, and data from attacks. From the CIA Triad to threat modeling and incident response.",
    icon: "shield-check",
    color: "rose",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 1,
    roadmap: {
      title: "Cybersecurity from Fundamentals to Defense",
      estimatedDays: 60,
      topics: curriculum("cybersecurity"),
    },
  },
  {
    slug: "web-development",
    name: "Web Development",
    description:
      "Build modern web apps from the browser to the database. HTTP, React, Next.js, auth, and deployment.",
    icon: "code-2",
    color: "blue",
    difficulty: "beginner",
    isCurated: true,
    orderIndex: 2,
    roadmap: {
      title: "Full-Stack Web Development",
      estimatedDays: 60,
      topics: curriculum("web-development"),
    },
  },
  {
    slug: "artificial-intelligence",
    name: "Artificial Intelligence",
    description:
      "The big ideas: search, logic, knowledge representation, agents — the foundations that pre-date deep learning and still matter.",
    icon: "brain",
    color: "violet",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 3,
    roadmap: {
      title: "Foundations of Artificial Intelligence",
      estimatedDays: 60,
      topics: curriculum("artificial-intelligence"),
    },
  },
  {
    slug: "machine-learning",
    name: "Machine Learning",
    description:
      "Models that learn from data. Regression, classification, clustering, neural networks — and the math underneath.",
    icon: "trending-up",
    color: "emerald",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 4,
    roadmap: {
      title: "Machine Learning: Theory and Practice",
      estimatedDays: 60,
      topics: curriculum("machine-learning"),
    },
  },
  {
    slug: "data-science",
    name: "Data Science",
    description:
      "Turn raw data into decisions. Statistics, wrangling, visualization, experimentation, and the storytelling that makes it land.",
    icon: "database",
    color: "cyan",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 5,
    roadmap: {
      title: "Data Science from Stats to Storytelling",
      estimatedDays: 60,
      topics: curriculum("data-science"),
    },
  },
  // Originally Phase-2 chatbot-served only. Promoted to curated in a later
  // expansion — each now has a full ~60-topic roadmap.
  {
    slug: "cloud-computing",
    name: "Cloud Computing",
    description:
      "Provision infrastructure on demand. AWS/Azure/GCP, IaaS/PaaS/SaaS, and the shared responsibility model.",
    icon: "cloud",
    color: "sky",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 6,
    roadmap: {
      title: "Cloud Computing: Fundamentals to Architectures",
      estimatedDays: 60,
      topics: curriculum("cloud-computing"),
    },
  },
  {
    slug: "devops",
    name: "DevOps",
    description:
      "Ship faster, safer. CI/CD, Docker, Kubernetes, observability, and the cultural practices behind them.",
    icon: "git-branch",
    color: "orange",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 7,
    roadmap: {
      title: "DevOps: Culture, Practice, Tools",
      estimatedDays: 60,
      topics: curriculum("devops"),
    },
  },
  {
    slug: "blockchain",
    name: "Blockchain",
    description:
      "Decentralized ledgers. Cryptographic hashing, consensus, smart contracts, and the systems built on top.",
    icon: "link",
    color: "amber",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 8,
    roadmap: {
      title: "Blockchain: From Hashing to DeFi",
      estimatedDays: 60,
      topics: curriculum("blockchain"),
    },
  },
  {
    slug: "iot",
    name: "Internet of Things",
    description:
      "Connecting the physical world. Sensors, MQTT, edge computing, and the architectures that scale to billions of devices.",
    icon: "cpu",
    color: "teal",
    difficulty: "intermediate",
    isCurated: true,
    orderIndex: 9,
    roadmap: {
      title: "IoT: From Sensors to the Cloud",
      estimatedDays: 60,
      topics: curriculum("iot"),
    },
  },
];

async function upsertDomain(d: SeedDomain): Promise<string> {
  const domain = await prisma.domain.upsert({
    where: { slug: d.slug },
    create: {
      slug: d.slug,
      name: d.name,
      description: d.description,
      icon: d.icon,
      color: d.color,
      difficulty: d.difficulty,
      isCurated: d.isCurated,
      orderIndex: d.orderIndex,
    },
    update: {
      name: d.name,
      description: d.description,
      icon: d.icon,
      color: d.color,
      difficulty: d.difficulty,
      isCurated: d.isCurated,
      orderIndex: d.orderIndex,
    },
  });
  return domain.id;
}

/** Split an array into fixed-size chunks. */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Cap rows per multi-row INSERT so a large roadmap can't build one oversized
// statement (Postgres caps parameters at 65535; 7 params/row) or hold a long
// write lock. Roadmaps top out around 60 topics today, so this is a single
// round trip in practice, with headroom to chunk anything larger.
const TOPIC_BATCH_SIZE = 100;

async function upsertRoadmap(domainId: string, d: SeedDomain): Promise<void> {
  if (!d.roadmap) return;

  const total = d.roadmap.topics.length;

  const roadmap = await prisma.roadmap.upsert({
    where: { domainId },
    create: {
      domainId,
      title: d.roadmap.title,
      totalTopics: total,
      estimatedDays: d.roadmap.estimatedDays,
    },
    update: {
      title: d.roadmap.title,
      totalTopics: total,
      estimatedDays: d.roadmap.estimatedDays,
    },
  });

  // Upsert topics by (roadmapId, orderIndex). Don't delete existing topics —
  // user_progress rows reference them via FK with cascade, but rows on a
  // user's account would be lost. Adding new topics is safe.
  //
  // One multi-row `INSERT ... ON CONFLICT DO UPDATE` per chunk — a single
  // round trip for the whole chunk instead of one per topic. `id` is only
  // consumed on insert (kept as-is on conflict); `created_at` uses its DB
  // default.
  const rows = d.roadmap.topics.map((t, i) =>
    Prisma.sql`(${randomUUID()}, ${roadmap.id}, ${i + 1}, ${t.title}, ${t.summary}, ${DIFFICULTY_BY_PHASE[t.phase]}, ${t.phase})`
  );

  for (const batch of chunk(rows, TOPIC_BATCH_SIZE)) {
    await prisma.$executeRaw`
      INSERT INTO topics (id, roadmap_id, order_index, title, summary, difficulty, phase)
      VALUES ${Prisma.join(batch)}
      ON CONFLICT (roadmap_id, order_index) DO UPDATE SET
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        difficulty = EXCLUDED.difficulty,
        phase = EXCLUDED.phase
    `;
  }
}

async function main(): Promise<void> {
  console.log(`Seeding ${DOMAINS.length} domains…`);

  for (const d of DOMAINS) {
    const domainId = await upsertDomain(d);
    await upsertRoadmap(domainId, d);
    const topicCount = d.roadmap?.topics.length ?? 0;
    const tag = d.isCurated ? `curated · ${topicCount} topics` : "chatbot-served";
    console.log(`  ✓ ${d.name.padEnd(26)} ${tag}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
