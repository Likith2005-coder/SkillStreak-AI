"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAuthStatus, useBootstrapUser } from "@/hooks/useUser";
import { useUserStore } from "@/store/userStore";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useBootstrapUser();
  const status = useAuthStatus();
  const user = useUserStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "ready" && user?.profile) {
      router.replace("/dashboard");
    }
  }, [status, user, router]);

  if (status === "idle" || status === "loading") {
    return null;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-25 gradient-bg-animated blur-3xl"
        aria-hidden
      />

      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="gradient-text font-semibold">SkillStreak</span>
          <span>AI</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card/60 p-8 shadow-lg backdrop-blur sm:p-10">
          {children}
        </div>
      </div>
    </main>
  );
}
