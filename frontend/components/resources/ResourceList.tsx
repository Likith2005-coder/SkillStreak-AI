"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Loader2, Video, Youtube } from "lucide-react";
import {
  apiErrorMessage,
  fetchResources,
  type ResourceItem,
  type ResourcesResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  topicId: string;
};

export function ResourceList({ topicId }: Props) {
  const [data, setData] = useState<ResourcesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  }, [topicId]);

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl border border-border bg-card/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.videos.length > 0 && (
        <Section title="Watch" icon={<Video className="h-4 w-4 text-rose-400" />} count={data.videos.length}>
          <div className="space-y-2">
            {data.videos.map((r, i) => (
              <ResourceRow key={r.id} item={r} index={i} icon={<Youtube className="h-4 w-4 text-rose-400" />} />
            ))}
          </div>
        </Section>
      )}

      {data.docs.length > 0 && (
        <Section title="Read" icon={<FileText className="h-4 w-4 text-cyan-400" />} count={data.docs.length}>
          <div className="space-y-2">
            {data.docs.map((r, i) => (
              <ResourceRow key={r.id} item={r} index={i} icon={<FileText className="h-4 w-4 text-cyan-400" />} />
            ))}
          </div>
        </Section>
      )}

      <p className="px-1 text-[11px] text-muted-foreground">
        Curated by AI, updated weekly. Video links open YouTube search results from
        reputable channels.
      </p>
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
        <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px]">{count}</span>
      </div>
      {children}
    </div>
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
  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      whileHover={{ x: 4 }}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3 transition-colors",
        "hover:border-primary/40 hover:bg-card"
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{item.title}</div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.source}</div>
      </div>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </motion.a>
  );
}
