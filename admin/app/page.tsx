"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ExternalLink,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  Users as UsersIcon,
} from "lucide-react";
import { api, clearToken, getToken, type Me } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Overview } from "@/components/Overview";
import { Topics } from "@/components/Topics";
import { Users } from "@/components/Users";
import { Access } from "@/components/Access";
import { Ops } from "@/components/Ops";

const LEARNER_URL = process.env.NEXT_PUBLIC_LEARNER_URL ?? "http://localhost:3000";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "content", label: "Content", icon: BookOpen },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "access", label: "Access", icon: KeyRound },
  { id: "ops", label: "Email", icon: Mail },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminPanel() {
  const router = useRouter();
  const [me, setMe] = useState<Me["user"] | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api
      .me()
      .then((r) => {
        if (r.user.role !== "admin") {
          clearToken();
          router.replace("/login");
          return;
        }
        setMe(r.user);
        setChecked(true);
      })
      .catch(() => {
        clearToken();
        router.replace("/login");
      });
  }, [router]);

  function logout() {
    clearToken();
    router.replace("/login");
  }

  if (!checked || !me) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="gradient-text">SkillStreak</span>
              <span>Admin</span>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300 sm:inline-flex">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live DB
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={LEARNER_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground sm:flex"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open learner site
            </a>
            <span className="hidden text-xs text-muted-foreground md:inline">{me.email}</span>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" /> Log out
            </button>
          </div>
        </div>
      </header>

      <div className="container px-4 py-8">
        {/* Tabs */}
        <nav className="mb-6 flex flex-wrap gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition",
                tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "overview" && <Overview />}
        {tab === "content" && <Topics />}
        {tab === "users" && <Users meId={me.id} />}
        {tab === "access" && <Access meId={me.id} />}
        {tab === "ops" && <Ops />}
      </div>
    </main>
  );
}
