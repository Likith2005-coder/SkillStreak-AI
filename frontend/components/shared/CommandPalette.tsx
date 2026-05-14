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
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { fetchDomains, type Domain } from "@/lib/api";
import { useUserStore } from "@/store/userStore";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.role === "admin";

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
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/60 pt-[12vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <Command
        label="Command palette"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Command.Input
            placeholder="Jump to anywhere — try 'domains', 'leaderboard', or 'cybersecurity'…"
            className="flex-1 bg-transparent px-1 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 text-sm">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nothing matches that. Try a domain name?
          </Command.Empty>

          <Command.Group heading="Navigate" className="text-xs uppercase tracking-wider text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            <Item icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" onSelect={() => go("/dashboard")} />
            <Item icon={<BookOpen className="h-4 w-4" />} label="Domains" onSelect={() => go("/domains")} />
            <Item icon={<Bot className="h-4 w-4" />} label="Chatbot" onSelect={() => go("/chatbot")} />
            <Item icon={<ListChecks className="h-4 w-4" />} label="Quiz history" onSelect={() => go("/progress")} />
            <Item icon={<ChartLine className="h-4 w-4" />} label="Progress" onSelect={() => go("/progress")} />
            <Item icon={<Trophy className="h-4 w-4" />} label="Leaderboard" onSelect={() => go("/leaderboard")} />
            <Item icon={<Settings className="h-4 w-4" />} label="Settings" onSelect={() => go("/settings")} />
            {isAdmin && (
              <Item icon={<ShieldCheck className="h-4 w-4" />} label="Admin" onSelect={() => go("/admin")} />
            )}
          </Command.Group>

          {domains.length > 0 && (
            <Command.Group heading="Domains" className="text-xs uppercase tracking-wider text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
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

          <Command.Group heading="Actions" className="text-xs uppercase tracking-wider text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            <Item icon={<Flame className="h-4 w-4 text-orange-400" />} label="Use a streak freeze" subtitle="Rescue a missed day" onSelect={() => go("/settings")} />
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          <span>
            <kbd className="rounded border border-border bg-muted/40 px-1.5 py-0.5">↑ ↓</kbd> navigate
            <span className="mx-1">·</span>
            <kbd className="rounded border border-border bg-muted/40 px-1.5 py-0.5">↵</kbd> select
          </span>
          <span>Cmd · K</span>
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
      className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-foreground aria-selected:bg-muted/60 aria-selected:text-foreground"
    >
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span>{label}</span>
      </div>
      {subtitle && (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      )}
    </Command.Item>
  );
}
