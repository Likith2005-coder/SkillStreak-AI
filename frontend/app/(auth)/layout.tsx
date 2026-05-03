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
        {/* Left side — animated characters on a brand-gradient panel.
            Hidden on mobile so the form has all the room. */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex">
          {/* Decorative background blobs + grid */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,rgba(255,255,255,0.18),transparent_55%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(217,70,239,0.25),transparent_50%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
            aria-hidden
          />

          {/* Brand mark */}
          <Link
            href="/"
            className="relative z-10 inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>SkillStreak AI</span>
          </Link>

          {/* Characters — anchored to the bottom-center of the panel */}
          <div className="relative z-10 flex flex-1 items-end justify-center">
            <AnimatedCharacters />
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center gap-6 text-xs text-white/60">
            <span>© SkillStreak AI</span>
            <Link href="/" className="transition hover:text-white">
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
