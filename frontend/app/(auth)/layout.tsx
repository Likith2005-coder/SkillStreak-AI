"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { useBootstrapUser } from "@/hooks/useUser";
import { Mascot } from "@/components/playground/Mascot";
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
  const pathname = usePathname() ?? "";
  const onRegister = pathname.startsWith("/register");

  return (
    <AuthFormProvider>
      <main className="grid min-h-[100svh] bg-background lg:grid-cols-2">
        {/* Left side — the crew's playground: a soft sky, a big friendly
            line, and the characters standing on a chunky green hill.
            Hidden on mobile so the form has all the room. */}
        <div className="relative hidden flex-col overflow-hidden bg-muted lg:flex">
          <div className="relative z-10 px-12 pt-10">
            <Link
              href="/"
              className="focus-ring inline-flex rounded-xl font-display text-2xl text-primary"
            >
              SkillStreak<span className="ml-1.5 text-foreground">AI</span>
            </Link>

            <h2 className="mt-14 max-w-md font-display text-5xl leading-[1.05] text-foreground [text-wrap:balance]">
              Your <span className="text-energy">streak</span> is waiting.
            </h2>
            <p className="mt-4 max-w-sm text-lg font-semibold text-muted-foreground [text-wrap:pretty]">
              The crew watches you type. They look away for passwords — promise.
            </p>
          </div>

          {/* Characters on the hill */}
          <div className="relative mt-auto flex justify-center">
            <div className="origin-bottom scale-[0.72] xl:scale-90 2xl:scale-100">
              <AnimatedCharacters />
            </div>
          </div>
          <div className="relative z-10 border-t-[10px] border-primary-bright bg-primary px-12 pb-6 pt-4">
            <div className="flex items-center gap-6 text-sm font-extrabold text-white">
              <span>© SkillStreak AI</span>
              <Link href="/" className="focus-ring rounded-md hover:underline">
                Home
              </Link>
              <span>v0.7.0</span>
            </div>
          </div>
        </div>

        {/* Right side — form */}
        <div className="relative flex items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-md">
            {/* Mobile-only brand + mascot (left panel hidden < lg) */}
            <div className="mb-6 flex flex-col items-center gap-4 lg:hidden">
              <Link href="/" className="focus-ring rounded-xl font-display text-2xl text-primary">
                SkillStreak<span className="ml-1.5 text-foreground">AI</span>
              </Link>
              <Mascot
                size={84}
                message={onRegister ? "A new learner! Let's get you set up." : "Welcome back! Your streak missed you."}
              />
            </div>

            <div className="card-chunky p-6 sm:p-8">{children}</div>
          </div>
        </div>
      </main>
    </AuthFormProvider>
  );
}
