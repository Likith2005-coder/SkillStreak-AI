"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useAuthStatus, useBootstrapUser } from "@/hooks/useUser";
import { useUserStore } from "@/store/userStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useBootstrapUser();
  const status = useAuthStatus();
  const user = useUserStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const onChatbotPage = pathname?.startsWith("/chatbot") ?? false;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "ready" && user && !user.profile) {
      router.replace("/onboarding");
    }
  }, [status, user, router]);

  if (status !== "ready" || !user || !user.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="aurora-bg" aria-hidden />
      {/* Skip link — only visible when focused via keyboard */}
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Navbar />
      {/* No `mode="wait"` — old page fades out underneath the new one rather
          than blocking the new one from rendering. Faster enter (180ms) and
          a near-instant exit make navigation feel immediate. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={pathname}
          id="main"
          tabIndex={-1}
          initial={{ opacity: 0, y: reduce ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
      <CommandPalette />
      {!onChatbotPage && <ChatWidget />}
    </div>
  );
}
