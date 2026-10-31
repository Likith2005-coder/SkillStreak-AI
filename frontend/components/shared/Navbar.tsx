"use client";

/**
 * App top bar, Midnight edition.
 *
 * A blurred sticky bar over a hairline with a faint lit seam. Left: the
 * wordmark with a glowing volt mark. Middle: quiet nav items; the active one
 * sits in a softly lit pill (layoutId, so it glides between items) with a
 * glowing volt underline. Right: the learner's vital signs as one mono
 * instrument readout — ember flame (glowing when the streak is alive), gold
 * gem for XP, violet star for level — then quick jump, settings and log out.
 *
 * On phones the five destinations live in the MobileTabBar instead.
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "next-view-transitions";
import { usePathname, useRouter } from "next/navigation";
import { animate, AnimatePresence, motion } from "framer-motion";
import {
  Flame,
  Gem,
  LayoutDashboard,
  LogOut,
  Map,
  MessageCircle,
  Search,
  Settings,
  Star,
  Terminal,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchStreak, logoutUser, type Streak } from "@/lib/api";
import { levelForXp } from "@/lib/level";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Domains", href: "/domains", icon: Map },
  { label: "Arsenal", href: "/toolkit", icon: Terminal },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Chat", href: "/chatbot", icon: MessageCircle },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const user = useUserStore((s) => s.user);
  const clear = useUserStore((s) => s.clear);
  const reduce = useReducedMotionSafe();

  // Topic/quiz pages are steps inside a domain roadmap, so they light up
  // "Domains". Pages with no nav entry (settings, progress) light nothing —
  // a false "Dashboard" highlight is worse than none.
  const activeNav = (() => {
    const direct = NAV.findIndex((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
    if (direct !== -1) return direct;
    if (pathname.startsWith("/topic/") || pathname.startsWith("/quiz/")) {
      return NAV.findIndex((n) => n.href === "/domains");
    }
    return -1;
  })();

  async function handleLogout() {
    await logoutUser();
    clear();
    router.replace("/");
  }

  return (
    <header className="vt-nav sticky top-0 z-30 border-b border-white/[0.06] bg-background/75 backdrop-blur-xl backdrop-saturate-150">
      {/* A faint lit seam along the bottom hairline: light catching the edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-[linear-gradient(90deg,transparent,hsl(var(--aurora-1)/0.35)_30%,hsl(var(--primary)/0.35)_60%,transparent)]"
      />
      <div className="container flex h-16 items-center justify-between gap-2 px-4">
        <Link
          href="/dashboard"
          className="focus-ring flex shrink-0 items-center gap-2 rounded-lg font-display text-[1.15rem] text-foreground"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_18px_-2px_hsl(var(--primary)/0.7)]"
          >
            <Flame className="h-4 w-4" fill="currentColor" strokeWidth={2} />
          </span>
          <span className="hidden sm:inline">
            SkillStreak<span className="font-serif-accent text-[1.3rem] text-primary"> AI</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 md:flex">
          {NAV.map((n, i) => {
            const on = i === activeNav;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                title={n.label}
                className={cn(
                  "focus-ring relative flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  on ? "text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                {on && (
                  <motion.span
                    layoutId="nav-active"
                    aria-hidden
                    className="absolute inset-x-0 inset-y-1.5 rounded-lg border border-white/10 bg-white/[0.06] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
                  >
                    <span className="absolute inset-x-3 -bottom-[7px] h-px rounded-full bg-primary shadow-[0_0_10px_1px_hsl(var(--primary)/0.8)]" />
                  </motion.span>
                )}
                <Icon
                  className={cn("relative h-[18px] w-[18px] shrink-0", on && "text-primary")}
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="relative sr-only xl:not-sr-only">{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 lg:gap-1.5">
          {user && <StatChips xp={user.xp} />}
          <button
            type="button"
            aria-label="Open command palette"
            title="Quick jump (Ctrl K)"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
            }}
            className="focus-ring hidden h-9 shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] pl-2.5 pr-1.5 text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground lg:flex"
          >
            <Search className="h-4 w-4" strokeWidth={2} />
            <kbd className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px]">
              Ctrl K
            </kbd>
          </button>
          {/* Admin lives in its own app (:3001) — no admin entry here. */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            aria-label="Settings"
            title="Settings"
            className="h-11 w-11 shrink-0 rounded-lg px-0 2xl:w-auto 2xl:px-3"
          >
            <Link href="/settings">
              <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
              <span className="hidden whitespace-nowrap text-sm 2xl:inline">Settings</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            // Phones sign out from Settings; keeps the bar from overflowing at 390px.
            className="hidden h-11 w-11 shrink-0 rounded-lg px-0 md:inline-flex 2xl:w-auto 2xl:px-3"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
            <span className="hidden whitespace-nowrap text-sm 2xl:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

// "1.2M" — used below `sm`, where the full number would overflow the bar.
const compactXp = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });

/**
 * Streak, XP and level, live on every screen. The streak refreshes whenever
 * XP moves (earning XP is what extends it), XP ticks up instead of jumping,
 * and a level-up pops the star once.
 */
function StatChips({ xp }: { xp: number }) {
  const reduce = useReducedMotionSafe();
  const { level, nextAt } = levelForXp(xp);

  const [streak, setStreak] = useState<Streak | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchStreak()
      .then((s) => !cancelled && setStreak(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [xp]);
  const days = streak?.currentStreak ?? 0;
  const alive = days > 0;

  const [shownXp, setShownXp] = useState(xp);
  const prevXp = useRef(xp);
  useEffect(() => {
    const from = prevXp.current;
    prevXp.current = xp;
    if (reduce || from === xp) {
      setShownXp(xp);
      return;
    }
    const c = animate(from, xp, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShownXp(Math.round(v)),
    });
    return () => c.stop();
  }, [xp, reduce]);

  const prevLevel = useRef(level);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (level > prevLevel.current && !reduce) setPulse((n) => n + 1);
    prevLevel.current = level;
  }, [level, reduce]);

  const chip =
    "flex h-8 shrink-0 items-center gap-1.5 px-2 font-mono text-[12px] font-semibold tabular-nums text-foreground sm:px-2.5";

  return (
    <div
      role="status"
      aria-label={`${days}-day streak. ${xp} XP. Level ${level}, ${nextAt} XP for level ${level + 1}.`}
      className="mr-0.5 flex items-center divide-x divide-white/[0.08] rounded-lg border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]"
    >
      <span className={cn(chip, !alive && "text-muted-foreground")} title={`${days}-day streak`} aria-hidden>
        <Flame
          className={cn(
            "h-4 w-4",
            alive ? "text-energy drop-shadow-[0_0_6px_hsl(var(--energy)/0.9)]" : "text-muted-foreground",
          )}
          fill={alive ? "currentColor" : "none"}
          strokeWidth={1.75}
        />
        {days}
      </span>
      <span className={chip} title={`${xp.toLocaleString()} XP`} aria-hidden>
        <Gem className="h-4 w-4 text-xp" strokeWidth={2} />
        <span className="sm:hidden">{compactXp.format(shownXp)}</span>
        <span className="hidden sm:inline">{shownXp.toLocaleString()}</span>
      </span>
      <span className={cn(chip, "relative")} title={`Level ${level}`} aria-hidden>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={pulse}
            initial={pulse > 0 ? { scale: 0.3, rotate: -30 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 12 }}
            className="flex"
          >
            <Star className="h-4 w-4 text-grape" fill="currentColor" strokeWidth={1.75} />
          </motion.span>
        </AnimatePresence>
        <span>
          <span className="hidden text-muted-foreground sm:inline">Lv </span>
          {level}
        </span>
      </span>
    </div>
  );
}
