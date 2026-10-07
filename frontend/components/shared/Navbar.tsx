"use client";

/**
 * App top bar, playground edition.
 *
 * Left: the wordmark. Middle: chunky rounded nav items, the active one a
 * tinted blue pill (selection = secondary). Right: the learner's vital signs
 * as big game-style stat chips — orange flame for streak, gold gem for XP,
 * grape star for level — then settings and log out.
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
    <header className="vt-nav sticky top-0 z-30 border-b-2 border-border bg-background">
      <div className="container flex h-16 items-center justify-between gap-2 px-4">
        <Link
          href="/dashboard"
          className="focus-ring flex shrink-0 items-center gap-1.5 rounded-xl font-display text-xl text-primary"
        >
          SkillStreak
          <span className="hidden text-foreground sm:inline">AI</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
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
                  "focus-ring flex h-11 items-center gap-2 rounded-2xl border-2 px-3 text-[15px] font-extrabold transition-colors",
                  on
                    ? "border-secondary-bright bg-secondary/10 text-secondary"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
                <span className="sr-only xl:not-sr-only">{n.label}</span>
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
            className="focus-ring hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
          >
            <Search className="h-5 w-5" strokeWidth={2.5} />
          </button>
          {/* Admin lives in its own app (:3001) — no admin entry here. */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            aria-label="Settings"
            title="Settings"
            className="h-10 w-10 shrink-0 rounded-xl px-0 text-muted-foreground hover:text-foreground 2xl:w-auto 2xl:px-3"
          >
            <Link href="/settings">
              <Settings className="h-5 w-5" strokeWidth={2.5} />
              <span className="hidden whitespace-nowrap text-sm 2xl:inline">Settings</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="h-10 w-10 shrink-0 rounded-xl px-0 text-muted-foreground hover:text-foreground 2xl:w-auto 2xl:px-3"
          >
            <LogOut className="h-5 w-5" strokeWidth={2.5} />
            <span className="hidden whitespace-nowrap text-sm 2xl:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

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

  const chip = "flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-1.5 text-base font-black tabular-nums sm:px-2.5";

  return (
    <div
      role="status"
      aria-label={`${days}-day streak. ${xp} XP. Level ${level}, ${nextAt} XP for level ${level + 1}.`}
      className="flex items-center"
    >
      <span className={cn(chip, alive ? "text-energy" : "text-muted-foreground")} title={`${days}-day streak`} aria-hidden>
        <Flame
          className={cn("h-6 w-6", alive ? "text-energy-bright" : "text-muted-foreground/60")}
          fill="currentColor"
          strokeWidth={2}
        />
        {days}
      </span>
      <span className={cn(chip, "text-xp")} title={`${xp.toLocaleString()} XP`} aria-hidden>
        <Gem className="h-6 w-6 text-xp-bright" fill="currentColor" strokeWidth={2} />
        {shownXp.toLocaleString()}
      </span>
      <span className={cn(chip, "relative text-grape")} title={`Level ${level}`} aria-hidden>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={pulse}
            initial={pulse > 0 ? { scale: 0.3, rotate: -30 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 12 }}
            className="flex"
          >
            <Star className="h-6 w-6 text-grape-bright" fill="currentColor" strokeWidth={2} />
          </motion.span>
        </AnimatePresence>
        {level}
      </span>
    </div>
  );
}
