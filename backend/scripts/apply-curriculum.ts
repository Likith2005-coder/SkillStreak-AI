/**
 * Apply the curated curricula in prisma/curriculum/<slug>.json to the
 * database: reorder each roadmap into its beginner → advanced sequence,
 * update phases / titles / summaries, and add any new topics.
 *
 * Learner data is never lost: existing topics are matched by their current
 * title (the JSON's `from`) and keep their id, so progress, quiz attempts,
 * chat sessions and cached lessons/resources stay attached. Nothing is
 * deleted; a roadmap with an unmatched existing topic is refused.
 *
 *   npx tsx scripts/apply-curriculum.ts            # dry run (default)
 *   npx tsx scripts/apply-curriculum.ts --apply    # write, after a JSON backup
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

type Phase = "foundations" | "core" | "advanced";
type CurriculumTopic = { title: string; summary: string; phase: Phase; from: string | null };
type Curriculum = { slug: string; topics: CurriculumTopic[] };

const DIFFICULTY: Record<Phase, string> = { foundations: "easy", core: "standard", advanced: "hard" };
const DIR = join(__dirname, "..", "prisma", "curriculum");
const APPLY = process.argv.includes("--apply");

const prisma = new PrismaClient();

async function main() {
  const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
  const curricula: Curriculum[] = files.map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")));
  console.log(`${APPLY ? "APPLY" : "DRY RUN"}: ${curricula.length} curricula`);

  // Plan everything first; refuse to touch the database if any roadmap fails.
  const plans: { slug: string; roadmapId: string; ops: { id: string | null; t: CurriculumTopic }[] }[] = [];
  let ok = true;
  for (const c of curricula) {
    const domain = await prisma.domain.findUnique({
      where: { slug: c.slug },
      include: { roadmap: { include: { topics: { select: { id: true, title: true, orderIndex: true } } } } },
    });
    if (!domain?.roadmap) {
      console.error(`  ✗ ${c.slug}: no roadmap in the database`);
      ok = false;
      continue;
    }
    const byTitle = new Map(domain.roadmap.topics.map((t) => [t.title, t]));
    const used = new Set<string>();
    const ops: { id: string | null; t: CurriculumTopic }[] = [];
    for (const t of c.topics) {
      if (t.from === null) {
        ops.push({ id: null, t });
        continue;
      }
      const existing = byTitle.get(t.from);
      if (!existing) {
        console.error(`  ✗ ${c.slug}: "from" not found in DB: ${t.from}`);
        ok = false;
        continue;
      }
      if (used.has(existing.id)) {
        console.error(`  ✗ ${c.slug}: topic used twice: ${t.from}`);
        ok = false;
      }
      used.add(existing.id);
      ops.push({ id: existing.id, t });
    }
    const orphans = domain.roadmap.topics.filter((t) => !used.has(t.id));
    if (orphans.length) {
      console.error(`  ✗ ${c.slug}: ${orphans.length} existing topic(s) missing from the curriculum: ${orphans.map((o) => o.title).join(" | ")}`);
      ok = false;
    }
    const moved = ops.filter((o, i) => o.id && domain.roadmap!.topics.find((t) => t.id === o.id)!.orderIndex !== i + 1).length;
    const renamed = ops.filter((o) => o.id && o.t.title !== o.t.from).length;
    const added = ops.filter((o) => !o.id).length;
    console.log(`  ${c.slug.padEnd(24)} ${ops.length} topics · ${moved} reordered · ${renamed} renamed · ${added} new`);
    plans.push({ slug: c.slug, roadmapId: domain.roadmap.id, ops });
  }
  if (!ok) throw new Error("Plan failed; nothing was written.");
  if (!APPLY) {
    console.log("Dry run only. Re-run with --apply to write.");
    return;
  }

  // Backup every affected roadmap's topics before writing.
  const backup = await prisma.topic.findMany({
    where: { roadmapId: { in: plans.map((p) => p.roadmapId) } },
    select: { id: true, roadmapId: true, orderIndex: true, title: true, summary: true, phase: true, difficulty: true },
  });
  const backupPath = join(tmpdir(), `skillstreak-topics-backup-${Date.now()}.json`);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup: ${backupPath}`);

  for (const p of plans) {
    await prisma.$transaction(
      async (tx) => {
        // Park every order_index out of the way first so the new sequence
        // never collides with the (roadmap_id, order_index) unique key.
        await tx.$executeRaw`UPDATE topics SET order_index = -order_index - 10000 WHERE roadmap_id = ${p.roadmapId}`;
        for (let i = 0; i < p.ops.length; i++) {
          const { id, t } = p.ops[i];
          if (id) {
            await tx.$executeRaw`
              UPDATE topics SET order_index = ${i + 1}, title = ${t.title}, summary = ${t.summary},
                phase = ${t.phase}, difficulty = ${DIFFICULTY[t.phase]}
              WHERE id = ${id}`;
          } else {
            await tx.$executeRaw`
              INSERT INTO topics (id, roadmap_id, order_index, title, summary, difficulty, phase)
              VALUES (${randomUUID()}, ${p.roadmapId}, ${i + 1}, ${t.title}, ${t.summary}, ${DIFFICULTY[t.phase]}, ${t.phase})`;
          }
        }
        await tx.roadmap.update({ where: { id: p.roadmapId }, data: { totalTopics: p.ops.length } });
      },
      { timeout: 120_000, maxWait: 30_000 },
    );
    console.log(`  ✓ ${p.slug}`);
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
