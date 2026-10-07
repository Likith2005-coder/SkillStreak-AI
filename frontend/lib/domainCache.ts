/**
 * In-memory cache of domain summaries, filled by the domains page.
 *
 * The roadmap page fetches its full data after mounting, but it already
 * knows enough to draw its header the instant it opens — name, icon, colour,
 * description — if the learner came from the domains grid. Rendering that
 * header immediately is what lets the domain card morph into it during the
 * page transition (a view transition can only morph into something that
 * exists when the new page first paints), and it means the page never opens
 * on a bare spinner.
 */
import type { Domain } from "./api";

const cache = new Map<string, Domain>();

export function rememberDomains(list: Domain[]): void {
  for (const d of list) cache.set(d.slug, d);
}

export function cachedDomain(slug: string | undefined): Domain | undefined {
  return slug ? cache.get(slug) : undefined;
}
