/**
 * Turns the tutor's Markdown into something we can render safely and lay out:
 *
 * - `<details><summary>…</summary>BODY</details>` answer blocks become a
 *   ````answer fenced block, rendered by <AnswerReveal>. No raw HTML is ever
 *   enabled in the Markdown renderer.
 * - Splits after the first `##` section ("The big idea") so the related image
 *   can sit right below it.
 */

const DETAILS_RE = /<details>\s*<summary>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/gi;

export function convertAnswerBlocks(markdown: string): string {
  return markdown.replace(DETAILS_RE, (_all, body: string) => {
    const text = body
      .split("\n")
      .map((l) => l.trim())
      .join("\n")
      .replace(/<\/?[a-z][^>]*>/gi, "") // stray tags inside the answer
      .replace(/`{4,}/g, "```")
      .trim();
    return text ? `\n\n\`\`\`\`answer\n${text}\n\`\`\`\`\n\n` : "";
  });
}

export function prepareLessonMarkdown(markdown: string): { intro: string; rest: string } {
  const md = convertAnswerBlocks(markdown);
  const lines = md.split("\n");
  let inFence = false;
  let headings = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) inFence = !inFence;
    if (!inFence && /^##\s/.test(lines[i])) {
      headings++;
      if (headings === 2) {
        return { intro: lines.slice(0, i).join("\n"), rest: lines.slice(i).join("\n") };
      }
    }
  }
  return { intro: "", rest: md };
}
