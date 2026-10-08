"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/Navbar";
import { MobileTabBar } from "@/components/shared/MobileTabBar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { PageLoader } from "@/components/shared/PageLoader";
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
  const onChatbotPage = pathname?.startsWith("/chatbot") ?? false;
  // The Arsenal paints its own hacker backdrop; Midnight's ambient light
  // would bleed through its terminal and muddy the green.
  const onArsenal = pathname?.startsWith("/toolkit") ?? false;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
  }, [status, user, router]);

  if (status !== "ready" || !user) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-[100svh] bg-background">
      {/* Ambient light: a faint top light pool and engineering grid on every
          screen (static, so cheap), plus the slow aurora drift on desktop
          (the class hides itself below lg). Behind everything, never
          interactive. */}
      {!onArsenal && (
        <>
          <div aria-hidden className="aurora-bg" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(60%_80%_at_50%_-10%,hsl(var(--aurora-2)/0.10),transparent_70%)]"
          />
          <div aria-hidden className="grid-faint pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem]" />
        </>
      )}
      {/* Skip link — only visible when focused via keyboard */}
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Navbar />
      {/* Page changes are animated by the View Transitions API (see the root
          layout). The old AnimatePresence wrapper here kept the outgoing page
          mounted beside the incoming one, which doubled the content during a
          transition and fought the view-transition morphs. Bottom padding on
          phones clears the tab bar. */}
      <div id="main" tabIndex={-1} className="pb-24 md:pb-0">
        {children}
      </div>
      <MobileTabBar />
      <CommandPalette />
      {!onChatbotPage && <ChatWidget />}
    </div>
  );
}
