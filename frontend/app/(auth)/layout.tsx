"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAuthStatus, useBootstrapUser } from "@/hooks/useUser";
import { useUserStore } from "@/store/userStore";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useBootstrapUser();
  const status = useAuthStatus();
  const user = useUserStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (status === "ready" && user) {
      router.replace(user.profile ? "/dashboard" : "/onboarding");
    }
  }, [status, user, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-25 gradient-bg-animated blur-3xl"
        aria-hidden
      />

      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="gradient-text font-semibold">SkillStreak</span>
          <span>AI</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card/60 p-8 shadow-lg backdrop-blur">
          {children}
        </div>
      </div>
    </main>
  );
}
