"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flame, LogOut, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import SparkleNavbar from "@/components/lightswind/SparkleNavbar";

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Domains", href: "/domains" },
  { label: "Arsenal", href: "/toolkit" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Chat", href: "/chatbot" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);
  const clear = useUserStore((s) => s.clear);

  // Topic/quiz pages are steps inside a domain roadmap, so they light up
  // "Domains". Pages with no nav entry (settings, progress) light nothing —
  // a false "Dashboard" underline is worse than none.
  const activeNav = (() => {
    const direct = NAV.findIndex(
      (n) => pathname === n.href || pathname.startsWith(n.href + "/")
    );
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
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="gradient-text">SkillStreak</span>
          <span className="text-foreground">AI</span>
        </Link>

        <div className="flex items-center gap-1.5 lg:gap-2.5">
          {user && (
            <div className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground sm:flex">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span>Level {user.level}</span>
              <span className="opacity-40">·</span>
              <span>{user.xp} XP</span>
            </div>
          )}
          <button
            type="button"
            aria-label="Open command palette"
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
              );
            }}
            className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground xl:flex"
          >
            <span>Quick jump</span>
            <kbd className="rounded border border-border/70 bg-background/60 px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
          {/* lightswind SparkleNavbar — primary nav with animated strike indicator */}
          <div className="hidden md:block">
            <SparkleNavbar
              items={NAV.map((n) => n.label)}
              color="#a855f7"
              initialIndex={activeNav}
              onSelect={(i) => router.push(NAV[i].href)}
            />
          </div>
          {/* Secondary actions collapse to icons below xl so the bar never wraps.
              Admin lives in its own app (:3001) — no admin entry here. */}
          <Button asChild variant="ghost" size="sm" aria-label="Settings" title="Settings" className="shrink-0">
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              <span className="hidden whitespace-nowrap xl:inline">Settings</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="shrink-0"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden whitespace-nowrap xl:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
