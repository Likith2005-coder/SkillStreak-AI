"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { Zap } from "lucide-react";
import { useBootstrapUser } from "@/hooks/useUser";
import { Mascot } from "@/components/playground/Mascot";
import { AuthFormProvider } from "./auth-form-context";

// Animated characters — listen to window mousemove, so client-only.
const AnimatedCharacters = dynamic(
  () =>
    import("@/components/auth/AnimatedCharacters").then(
      (m) => m.AnimatedCharacters
    ),
  { ssr: false }
);

function Wordmark() {
  return (
    <Link
      href="/"
      className="focus-ring inline-flex items-center gap-2 rounded-lg font-display text-xl text-foreground"
    >
      <span
        aria-hidden
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_18px_-2px_hsl(var(--primary)/0.7)]"
      >
        <Zap className="h-4 w-4" fill="currentColor" strokeWidth={1.5} />
      </span>
      <span>
        SkillStreak<span className="ml-1 text-muted-foreground">AI</span>
      </span>
    </Link>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useBootstrapUser();
  const pathname = usePathname() ?? "";
  const onRegister = pathname.startsWith("/register");

  return (
    <AuthFormProvider>
      <main className="relative grid min-h-[100svh] overflow-hidden bg-background lg:grid-cols-2">
        {/* Left — the crew's stage: a dark room, a big line, and the four
            characters standing in a pool of aurora light on a lit floor.
            Hidden on mobile so the form has all the room. */}
        <div className="relative hidden flex-col overflow-hidden border-r border-white/[0.06] bg-[hsl(228_22%_4.5%)] lg:flex">
          <div aria-hidden className="grid-faint pointer-events-none absolute inset-0" />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-1)/0.14),transparent)] blur-2xl"
          />

          <div className="relative z-10 px-12 pt-10">
            <Wordmark />

            <h2 className="mt-14 max-w-md font-display text-5xl leading-[1.02] text-foreground [text-wrap:balance] xl:text-6xl">
              Your{" "}
              <span className="font-serif-accent text-energy [text-shadow:0_0_28px_hsl(var(--energy)/0.55)]">streak</span>{" "}
              is waiting.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground [text-wrap:pretty]">
              The crew watches you type. They look away for passwords — promise.
            </p>
          </div>

          {/* The crew, standing on a horizon of light */}
          <div className="relative mt-auto flex justify-center">
            <div className="origin-bottom scale-[0.72] xl:scale-90 2xl:scale-100">
              <AnimatedCharacters />
            </div>
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--aurora-1)/0.7)_20%,hsl(var(--aurora-3))_50%,hsl(var(--aurora-4)/0.7)_80%,transparent)] shadow-[0_0_24px_2px_hsl(var(--aurora-3)/0.5)]"
            />
          </div>
          {/* Floor: the light reflected back up off a glossy surface */}
          <div className="relative z-10 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,hsl(var(--aurora-2)/0.14),transparent_70%)] px-12 pb-6 pt-5">
            <div className="flex items-center gap-5 font-mono text-[11px] text-muted-foreground">
              <span>© SkillStreak AI</span>
              <Link href="/" className="focus-ring rounded-md transition-colors hover:text-foreground">
                Home
              </Link>
              <span className="ml-auto">v0.7.0</span>
            </div>
          </div>
        </div>

        {/* Right — the form */}
        <div className="relative flex items-center justify-center px-4 py-12 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--aurora-2)/0.12),hsl(var(--aurora-1)/0.06)_55%,transparent)] blur-2xl"
          />
          <div className="relative w-full max-w-md">
            {/* Mobile-only brand + mascot (left panel hidden < lg) */}
            <div className="mb-6 flex flex-col items-center gap-4 lg:hidden">
              <Wordmark />
              <Mascot
                size={84}
                message={onRegister ? "A new learner! Let's get you set up." : "Welcome back! Your streak missed you."}
              />
            </div>

            <div className="card-chunky border-beam rounded-[1.4rem] p-6 shadow-[0_40px_100px_-40px_hsl(var(--aurora-2)/0.4)] sm:p-8">
              <div className="relative">{children}</div>
            </div>
          </div>
        </div>
      </main>
    </AuthFormProvider>
  );
}
