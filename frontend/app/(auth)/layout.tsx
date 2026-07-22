"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAuthStatus, useBootstrapUser } from "@/hooks/useUser";
import { useUserStore } from "@/store/userStore";
import { AuthFormProvider } from "./auth-form-context";

// Animated cartoon characters — listen to window mousemove, so client-only.
const AnimatedCharacters = dynamic(
  () =>
    import("@/components/auth/AnimatedCharacters").then(
      (m) => m.AnimatedCharacters
    ),
  { ssr: false }
);

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
    <AuthFormProvider>
      <main className="grid min-h-screen lg:grid-cols-2">
        {/* Left side — the Signal world: deep ink, neon grid floor, ghost
            word, with the animated characters standing on the horizon.
            Hidden on mobile so the form has all the room. */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-background p-12 lg:flex">
          {/* Ghost word behind everything */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
            aria-hidden
          >
            <span className="ghost-word text-[11vw] leading-none">STREAK</span>
          </div>
          {/* Neon perspective floor the characters stand on */}
          <div className="grid-scene" aria-hidden>
            <div className="grid-floor" />
          </div>
          {/* Cyan + violet blooms */}
          <div
            className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-primary/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-20 top-8 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl"
            aria-hidden
          />

          {/* Brand mark */}
          <Link
            href="/"
            className="relative z-10 inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span>
              <span className="gradient-text">SkillStreak</span> AI
            </span>
          </Link>

          {/* Tagline + characters — the crew reacts while you type */}
          <div className="relative z-10 flex flex-1 flex-col justify-end">
            <div className="mb-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
                System online
              </p>
              <h2 className="mt-2 max-w-sm font-display text-3xl font-semibold tracking-tight text-foreground [text-wrap:balance]">
                Your streak is waiting.
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                The crew watches you type. They look away for passwords —
                promise.
              </p>
            </div>
            <div className="flex items-end justify-center">
              <AnimatedCharacters />
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 mt-8 flex items-center gap-6 text-xs text-muted-foreground">
            <span>© SkillStreak AI</span>
            <Link href="/" className="transition hover:text-foreground">
              Home
            </Link>
            <span>v0.7.0</span>
          </div>
        </div>

        {/* Right side — form */}
        <div className="relative flex items-center justify-center bg-background px-4 py-16">
          <div className="w-full max-w-md">
            {/* Mobile-only brand mark (left panel hidden < lg) */}
            <Link
              href="/"
              className="mb-8 flex items-center justify-center gap-2 text-sm text-muted-foreground transition hover:text-foreground lg:hidden"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="gradient-text font-semibold">SkillStreak</span>
              <span>AI</span>
            </Link>

            <div className="rounded-2xl border border-border bg-card/70 p-8 shadow-2xl backdrop-blur-xl">
              {children}
            </div>
          </div>
        </div>
      </main>
    </AuthFormProvider>
  );
}
