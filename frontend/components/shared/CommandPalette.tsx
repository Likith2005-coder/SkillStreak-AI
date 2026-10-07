"use client";

/**
 * Global Cmd/Ctrl+K command palette.
 *
 * Opens on the keyboard shortcut anywhere in the dashboard. Lets the user
 * jump to the major pages, open the chatbot, or navigate to any domain.
 * Pattern: cmdk + a thin shadcn-style dialog shell.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  BookOpen,
  Bot,
  ChartLine,
  Flame,
  LayoutDashboard,
  ListChecks,
  Search,
  Settings,
  Sparkles,
  Trophy,
} from "lucide-react";
import { fetchDomains, type Domain } from "@/lib/api";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);

  // Cmd+K / Ctrl+K toggles the palette. Esc closes (handled by cmdk itself).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lazy-load domains the first time the palette is opened.
  useEffect(() => {
    if (!open || domains.length > 0) return;
    fetchDomains()
      .then((d) => setDomains(d))
      .catch(() => {
        /* palette still works without domains */
      });
  }, [open, domains.length]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-foreground/40 px-4 pt-[12vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <Command
        label="Command palette"
        className="w-full max-w-xl overflow-hidden rounded-3xl border-2 border-b-[6px] border-border bg-card"
      >
        <div className="flex items-center gap-2 border-b-2 border-border px-4 focus-within:border-secondary-bright">
          <Search className="h-5 w-5 text-muted-foreground" strokeWidth={2.5} />
          <Command.Input
            placeholder="Jump to anywhere — try 'domains', 'leaderboard', or 'cybersecurity'…"
            className="flex-1 bg-transparent px-1 py-4 text-base font-bold outline-none placeholder:font-semibold placeholder:text-muted-foreground"
            aria-label="Search commands and destinations"
          />
          <kbd className="rounded-lg border-2 border-b-[3px] border-border bg-card px-1.5 py-0.5 text-[11px] font-extrabold text-muted-foreground">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 text-sm">
          <Command.Empty className="px-3 py-8 text-center text-sm font-bold text-muted-foreground">
            Nothing matches that. Try a domain name?
          </Command.Empty>

          <Command.Group heading="Navigate" className="text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-extrabold">
            <Item icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" onSelect={() => go("/dashboard")} />
            <Item icon={<BookOpen className="h-4 w-4" />} label="Domains" onSelect={() => go("/domains")} />
            <Item icon={<Bot className="h-4 w-4" />} label="Chatbot" onSelect={() => go("/chatbot")} />
            <Item icon={<ListChecks className="h-4 w-4" />} label="Quiz history" onSelect={() => go("/progress")} />
            <Item icon={<ChartLine className="h-4 w-4" />} label="Progress" onSelect={() => go("/progress")} />
            <Item icon={<Trophy className="h-4 w-4" />} label="Leaderboard" onSelect={() => go("/leaderboard")} />
            <Item icon={<Settings className="h-4 w-4" />} label="Settings" onSelect={() => go("/settings")} />
          </Command.Group>

          {domains.length > 0 && (
            <Command.Group heading="Domains" className="text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-extrabold">
              {domains.map((d) => (
                <Item
                  key={d.id}
                  icon={<Sparkles className="h-4 w-4 text-primary" />}
                  label={d.name}
                  subtitle={d.roadmap ? `${d.roadmap.totalTopics} topics` : "via chatbot"}
                  onSelect={() =>
                    go(d.isCurated ? `/domains/${d.slug}` : `/chatbot?domain=${d.slug}`)
                  }
                />
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Actions" className="text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-extrabold">
            <Item icon={<Flame className="h-4 w-4 text-energy-bright" fill="currentColor" />} label="Use a streak freeze" subtitle="Rescue a missed day" onSelect={() => go("/settings")} />
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-between border-t-2 border-border px-4 py-2.5 text-xs font-bold text-muted-foreground">
          <span>
            <kbd className="rounded-lg border-2 border-b-[3px] border-border bg-card px-1.5 py-0.5">↑ ↓</kbd> navigate
            <span className="mx-1">·</span>
            <kbd className="rounded-lg border-2 border-b-[3px] border-border bg-card px-1.5 py-0.5">↵</kbd> select
          </span>
          <span>Ctrl / ⌘ K</span>
        </div>
      </Command>
    </div>
  );
}

function Item({
  icon,
  label,
  subtitle,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex min-h-11 cursor-pointer items-center justify-between rounded-2xl border-2 border-transparent px-3 py-2 font-bold text-foreground aria-selected:border-secondary-bright aria-selected:bg-secondary/10 aria-selected:text-secondary"
    >
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span>{label}</span>
      </div>
      {subtitle && (
        <span className="text-xs font-semibold text-muted-foreground">{subtitle}</span>
      )}
    </Command.Item>
  );
}
