/**
 * Makes morphing titles scale proportionally during a view transition.
 *
 * By default a shared element's snapshot is stretched to fill its new box, so
 * a small card title morphing into a large page title gets squashed. The fix
 * is `height: 100%; width: auto` on its snapshot pseudo-elements — but those
 * names are per-domain (`domain-title-<slug>`), and the build's CSS parser
 * rejects the class-based selector that would cover them all. So the rule is
 * emitted at runtime, for exactly the slugs on the page, on both ends of the
 * transition.
 */
export function MorphTextStyle({ slugs }: { slugs: string[] }) {
  if (!slugs.length) return null;
  const sel = slugs
    .map((s) => `::view-transition-old(domain-title-${s}),::view-transition-new(domain-title-${s})`)
    .join(",");
  return <style>{`${sel}{height:100%;width:auto;}`}</style>;
}
