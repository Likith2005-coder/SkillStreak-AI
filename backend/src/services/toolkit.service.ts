/**
 * Ethical Hacking Arsenal service.
 *
 * Serves the curated phase/tool catalogue and generates (then caches) a
 * step-by-step, authorized-use guide per tool via the LLM — mirroring the
 * topic-explanation pattern in topic.service.ts.
 */

import fs from "fs";
import path from "path";
import { ApiError } from "../middleware/error.middleware";
import { complete } from "./llm.service";
import { remember } from "./cache.service";
import { log } from "../utils/logger.util";
import {
  getPhases,
  getToolsForPhase,
  findTool,
  findPhase,
  type HackingPhase,
  type HackingTool,
} from "../data/hackingTools";
import { TOOL_GUIDE_SYSTEM, buildToolGuideUserPrompt } from "../prompts/tool.prompt";

// Guides are stable reference content — cache 30 days.
const GUIDE_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Pre-generated guides shipped as a committed JSON file (see
 * scripts/generate-tool-guides.ts). Loaded once into memory so tool pages open
 * INSTANTLY — no per-request LLM call. Missing slugs fall back to on-demand
 * generation + cache below.
 */
let preGenerated: Record<string, string> | null = null;
function getPreGenerated(): Record<string, string> {
  if (preGenerated !== null) return preGenerated;
  try {
    const p = path.join(process.cwd(), "src", "data", "tool-guides.generated.json");
    if (fs.existsSync(p)) {
      preGenerated = JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, string>;
      log.info("toolkit: loaded pre-generated guides", { count: Object.keys(preGenerated).length });
    } else {
      preGenerated = {};
    }
  } catch (err) {
    log.warn("toolkit: failed to load pre-generated guides", {
      error: err instanceof Error ? err.message : String(err),
    });
    preGenerated = {};
  }
  return preGenerated;
}

export type PhaseWithTools = HackingPhase & { tools: HackingTool[] };

/** The whole arsenal: phases in order, each with its tools. */
export function getArsenal(): PhaseWithTools[] {
  return getPhases().map((p) => ({ ...p, tools: getToolsForPhase(p.slug) }));
}

export function getToolWithPhase(slug: string): { tool: HackingTool; phase: HackingPhase | undefined } {
  const tool = findTool(slug);
  if (!tool) throw new ApiError(404, "Tool not found");
  return { tool, phase: findPhase(tool.phase) };
}

export async function getToolGuide(
  slug: string
): Promise<{ tool: HackingTool; phase: HackingPhase | undefined; guide: string; cached: boolean }> {
  const { tool, phase } = getToolWithPhase(slug);

  // Fast path: serve the pre-generated guide instantly (no LLM call).
  const pre = getPreGenerated()[slug];
  if (pre) {
    return { tool, phase, guide: pre, cached: true };
  }

  const { value, cached } = await remember<{ guide: string }>(
    // v2: deeper, command-packed guides. Bumping the version regenerates the
    // shorter v1 guides that may be cached.
    `toolguide:${slug}:v2`,
    GUIDE_TTL_SECONDS,
    async () => {
      const guide = await complete({
        systemPrompt: TOOL_GUIDE_SYSTEM,
        userPrompt: buildToolGuideUserPrompt(tool, phase),
        temperature: 0.5,
        maxTokens: 4096,
      });
      return { guide };
    }
  );

  return { tool, phase, guide: value.guide, cached };
}
