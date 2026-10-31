"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { LessonImage } from "@/lib/api";

/**
 * A real, related picture for the lesson (Wikipedia / Wikimedia Commons).
 * Plain <img> so no next/image domain config is needed. Disappears quietly if
 * the file fails to load.
 */
export function LessonFigure({ image }: { image: LessonImage }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (failed) return null;

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-white/[0.08] bg-[hsl(var(--background)/0.6)]">
      <div className="relative flex items-center justify-center bg-[radial-gradient(ellipse_at_center,hsl(0_0%_100%/0.04),transparent_70%)] p-3 sm:p-4">
        {!loaded && (
          <div aria-hidden className="absolute inset-3 animate-pulse rounded-lg bg-white/[0.04] motion-reduce:animate-none sm:inset-4" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.caption}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="relative h-auto max-h-[360px] w-auto max-w-full rounded-lg object-contain transition-opacity duration-300 motion-reduce:transition-none"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      </div>
      <figcaption className="flex flex-col gap-1 border-t border-white/[0.06] px-4 py-3 text-[13px] leading-snug sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <span className="text-foreground/80">{image.caption}</span>
        <a
          href={image.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex shrink-0 items-center gap-1 rounded text-muted-foreground transition-colors hover:text-secondary motion-reduce:transition-none"
          title={image.credit}
        >
          Source: Wikipedia
          <ExternalLink aria-hidden className="h-3 w-3" strokeWidth={2.2} />
        </a>
      </figcaption>
    </figure>
  );
}
