"use client";

/**
 * Global Cmd/Ctrl+K command palette.
 *
 * Opens on the keyboard shortcut anywhere in the dashboard. Lets the user
 * jump to the major pages, open the chatbot, or navigate to any domain.
 * Pattern: cmdk + a thin dialog shell. Midnight: a Raycast-grade floating
 * panel over a blurred dim, icon wells, a lit selection row with a volt
 * edge glow, and mono key hints.
 */

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  BookOpen,
  Bot,
  ChartLine,
  CornerDownLeft,
  Flame,
  LayoutDashboard,
  ListChecks,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Trophy,
} from "lucide-react";
import { fetchDomains, type Domain } from "@/lib/api";

const GROUP =
  "[&_[cmdk-group-heading]]:label-mono [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-muted-foreground";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Whatever had focus before the palette opened; focus goes back there on close.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Cmd+K / Ctrl+K toggles the palette. Esc closes (handled by cmdk itself).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === "k") {
        e.preventDefault();
        // Remember the opener now: by the time an effect runs, the input's
        // autoFocus has already moved focus into the palette.
        const active = document.activeElement;
        if (active instanceof HTMLElement && !dialogRef.current?.contains(active)) {
          returnFocusRef.current = active;
        }
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
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

  // While open: lock page scroll; on close: restore scroll and focus.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prevOverflow;
      const el = returnFocusRef.current;
      returnFocusRef.current = null;
      if (el && el.isConnected) el.focus({ preventScroll: true });
    };
  }, [open]);

  // Keep Tab inside the dialog.
  function trapTab(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {/* No entrance: a keyboard shortcut used constantly should be instant
          both ways, like Raycast. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={trapTab}
        className="relative w-full max-w-xl"
      >
        {/* Aurora light leaking from behind the panel. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-10 -top-16 h-40 rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-1)/0.25),transparent)] blur-2xl"
        />
        <Command
          label="Command palette"
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/95 shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_30px_80px_-20px_rgb(0_0_0/0.9),0_0_0_1px_rgb(0_0_0/0.5)]"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-4">
            <Search className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={2} />
            <Command.Input
              autoFocus
              placeholder="Jump to anywhere: 'domains', 'leaderboard', 'cybersecurity'…"
              className="h-14 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search commands and destinations"
            />
            <kbd className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 text-sm">
            <Command.Empty className="px-3 py-10 text-center text-sm text-muted-foreground">
              Nothing matches that. Try a domain name?
            </Command.Empty>

            <Command.Group heading="Navigate" className={GROUP}>
              <Item icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" onSelect={() => go("/dashboard")} />
              <Item icon={<BookOpen className="h-4 w-4" />} label="Domains" onSelect={() => go("/domains")} />
              <Item icon={<Bot className="h-4 w-4" />} label="Chatbot" onSelect={() => go("/chatbot")} />
              <Item icon={<ListChecks className="h-4 w-4" />} label="Quiz history" onSelect={() => go("/progress")} />
              <Item icon={<RotateCcw className="h-4 w-4" />} label="Mistake review" onSelect={() => go("/review")} />
              <Item icon={<ChartLine className="h-4 w-4" />} label="Progress" onSelect={() => go("/progress")} />
              <Item icon={<Trophy className="h-4 w-4" />} label="Leaderboard" onSelect={() => go("/leaderboard")} />
              <Item icon={<Settings className="h-4 w-4" />} label="Settings" onSelect={() => go("/settings")} />
            </Command.Group>

            {domains.length > 0 && (
              <Command.Group heading="Domains" className={GROUP}>
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

            <Command.Group heading="Actions" className={GROUP}>
              <Item
                icon={<Flame className="h-4 w-4 text-energy" fill="currentColor" />}
                label="Use a streak freeze"
                subtitle="Rescue a missed day"
                onSelect={() => go("/settings")}
              />
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>
                  <CornerDownLeft className="h-3 w-3" />
                </Kbd>{" "}
                select
              </span>
            </span>
            <span className="font-mono text-[11px]">Ctrl / ⌘ K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] px-1 font-mono text-[10px] text-foreground/80">
      {children}
    </kbd>
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
      className="group relative flex min-h-11 cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-foreground transition-colors aria-selected:bg-white/[0.06]"
    >
      <span
        aria-hidden
        className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary opacity-0 shadow-[0_0_10px_hsl(var(--primary)/0.9)] transition-opacity group-aria-selected:opacity-100"
      />
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-muted-foreground group-aria-selected:text-foreground">
          {icon}
        </span>
        <span className="font-medium">{label}</span>
      </div>
      {subtitle && <span className="font-mono text-[11px] text-muted-foreground">{subtitle}</span>}
    </Command.Item>
  );
}
