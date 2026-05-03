"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Flame, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/api";
import { useUserStore } from "@/store/userStore";

export function Navbar() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const clear = useUserStore((s) => s.clear);

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

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground sm:flex">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span>Level {user.level}</span>
              <span className="opacity-40">·</span>
              <span>{user.xp} XP</span>
            </div>
          )}
          <Button asChild variant="ghost" size="sm" aria-label="Open chatbot">
            <Link href="/chatbot">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Log out">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
