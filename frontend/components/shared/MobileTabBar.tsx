"use client";

/**
 * Bottom tab bar for phones. Below `md` the desktop navbar has no room for the
 * five destinations, and before this existed they simply disappeared — the
 * only reachable pages on a phone were Settings and Log out.
 *
 * A bottom bar is the pattern phone users already know, keeps the targets in
 * thumb reach, and the active pill slides between tabs (layoutId) rather than
 * jumping.
 */

import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Map, MessageCircle, Terminal, Trophy } from "lucide-react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Domains", href: "/domains", icon: Map },
  { label: "Arsenal", href: "/toolkit", icon: Terminal },
  { label: "Ranks", href: "/leaderboard", icon: Trophy },
  { label: "Chat", href: "/chatbot", icon: MessageCircle },
];

function activeIndex(pathname: string) {
  const i = TABS.findIndex((t) => pathname === t.href || pathname.startsWith(t.href + "/"));
  if (i !== -1) return i;
  // Topics and quizzes are steps inside a domain's roadmap.
  if (pathname.startsWith("/topic/") || pathname.startsWith("/quiz/")) return 1;
  return -1;
}

export function MobileTabBar() {
  const pathname = usePathname() ?? "";
  const reduce = useReducedMotionSafe();
  const active = activeIndex(pathname);

  return (
    <nav
      aria-label="Primary"
      className="vt-tabbar fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 gap-1 px-2 py-1.5">
        {TABS.map((t, i) => {
          const on = i === active;
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "focus-ring relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-extrabold transition-colors",
                  on ? "text-secondary" : "text-muted-foreground active:bg-muted",
                )}
              >
                {on && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-2xl border-2 border-secondary-bright bg-secondary/10"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }}
                    aria-hidden
                  />
                )}
                <Icon className="relative h-6 w-6" strokeWidth={on ? 2.75 : 2.25} aria-hidden />
                <span className="relative">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
