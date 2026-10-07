"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Play, RefreshCw, Video, Youtube } from "lucide-react";
import {
  apiErrorMessage,
  fetchResources,
  type ResourceItem,
  type ResourcesResponse,
} from "@/lib/api";
import { useReducedMotionSafe as useReducedMotion } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

type Props = {
  topicId: string;
};

export function ResourceList({ topicId }: Props) {
  const [data, setData] = useState<ResourcesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumping this re-runs the effect: the first generation warms a 7-day cache,
  // so a retry after a slow cold start almost always resolves instantly.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetchResources(topicId)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Could not load resources")));
    return () => {
      cancelled = true;
    };
  }, [topicId, attempt]);

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/10 p-4">
        <p className="text-sm font-semibold text-destructive-text">{error}</p>
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          className="focus-ring mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-b-4 border-destructive/40 bg-card px-4 text-xs font-extrabold uppercase tracking-wide text-destructive-text transition-transform active:translate-y-[2px] active:border-b-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.videos.length > 0 && (
        <Section title="Watch" icon={<Video className="h-4 w-4" strokeWidth={2.6} />} tone="bg-rose-500" count={data.videos.length}>
          <div className="space-y-2">
            {data.videos.map((r, i) => (
              <VideoRow key={r.id} item={r} index={i} />
            ))}
          </div>
        </Section>
      )}

      {data.docs.length > 0 && (
        <Section title="Read" icon={<FileText className="h-4 w-4" strokeWidth={2.6} />} tone="bg-secondary-bright" count={data.docs.length}>
          <div className="space-y-2">
            {data.docs.map((r, i) => (
              <ResourceRow key={r.id} item={r} index={i} icon={<FileText className="h-5 w-5 text-secondary" strokeWidth={2.4} />} />
            ))}
          </div>
        </Section>
      )}

      <p className="px-1 text-xs font-semibold text-muted-foreground">
        Curated and verified, updated weekly. Each video opens the best matching
        video on YouTube.
      </p>
    </div>
  );
}

function Section({
  title,
  icon,
  tone,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span aria-hidden className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-white", tone)}>
          {icon}
        </span>
        <h3 className="text-sm font-black text-foreground">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-extrabold tabular-nums text-muted-foreground">{count}</span>
      </div>
      {children}
    </div>
  );
}

// A chunky, pressable row: 2px outline with a heavier bottom edge that sinks on press.
const ROW =
  "focus-ring group flex items-center gap-3 rounded-2xl border-2 border-b-4 border-border bg-card p-2.5 transition-[transform,border-width,background-color] duration-100 hover:bg-muted/50 active:translate-y-[2px] active:border-b-2 motion-reduce:transition-none";

function VideoRow({ item, index }: { item: ResourceItem; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      // opacity only: framer-motion would own `transform` and cancel the press sink
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : index * 0.04 }}
      className={ROW}
    >
      <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Youtube className="h-5 w-5 text-rose-600" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-6 w-6 fill-white text-white drop-shadow" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-sm font-bold leading-snug text-foreground">{item.title}</div>
        <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Youtube className="h-3.5 w-3.5 text-rose-600" />
          <span className="truncate">{item.source}</span>
        </div>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" strokeWidth={2.6} />
    </motion.a>
  );
}

function ResourceRow({
  item,
  index,
  icon,
}: {
  item: ResourceItem;
  index: number;
  icon: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      // opacity only: framer-motion would own `transform` and cancel the press sink
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : index * 0.04 }}
      className={cn(ROW, "p-3")}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-sm font-bold leading-snug text-foreground">{item.title}</div>
        <div className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">{item.source}</div>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" strokeWidth={2.6} />
    </motion.a>
  );
}
