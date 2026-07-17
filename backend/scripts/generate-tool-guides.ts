/**
 * Pre-generate the step-by-step guide for every tool in the arsenal and write
 * them to src/data/tool-guides.generated.json. The toolkit service then serves
 * these instantly (no per-request LLM call).
 *
 * Run: npx tsx scripts/generate-tool-guides.ts
 * Re-run whenever tools or the guide prompt change.
 */
import fs from "fs";
import path from "path";
import { TOOLS, findTool, findPhase } from "../src/data/hackingTools";
import { complete } from "../src/services/llm.service";
import { TOOL_GUIDE_SYSTEM, buildToolGuideUserPrompt } from "../src/prompts/tool.prompt";

// Gemini free tier allows ~15 requests/min. Go sequential with a delay to
// stay comfortably under it.
const DELAY_MS = 5000;
const OUT = path.join(process.cwd(), "src", "data", "tool-guides.generated.json");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function generateOne(slug: string): Promise<[string, string] | null> {
  const tool = findTool(slug);
  if (!tool) return null;
  const phase = findPhase(tool.phase);
  try {
    const guide = await complete({
      systemPrompt: TOOL_GUIDE_SYSTEM,
      userPrompt: buildToolGuideUserPrompt(tool, phase),
      temperature: 0.5,
      maxTokens: 4096,
    });
    console.log(`  ✓ ${tool.name} (${guide.length} chars)`);
    return [slug, guide];
  } catch (err) {
    console.log(`  ✗ ${tool.name} FAILED: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

async function main() {
  // Preserve any previously-generated guides so a partial re-run doesn't wipe them.
  let existing: Record<string, string> = {};
  if (fs.existsSync(OUT)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUT, "utf8"));
    } catch {
      existing = {};
    }
  }

  const out: Record<string, string> = { ...existing };
  // Only generate the ones we don't already have (so re-runs fill gaps cheaply).
  const todo = TOOLS.map((t) => t.slug).filter((s) => !out[s]);
  console.log(`${Object.keys(existing).length} already done · generating ${todo.length} remaining…`);

  for (let i = 0; i < todo.length; i++) {
    const r = await generateOne(todo[i]);
    if (r) {
      out[r[0]] = r[1];
      fs.writeFileSync(OUT, JSON.stringify(out, null, 2)); // incremental save
    }
    if (i < todo.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nDone. Wrote ${Object.keys(out).length} guides to ${OUT}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
