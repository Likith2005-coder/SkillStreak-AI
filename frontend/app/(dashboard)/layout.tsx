"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { MobileTabBar } from "@/components/shared/MobileTabBar";
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
  const onChatbotPage = pathname?.startsWith("/chatbot") ?? false;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
  }, [status, user, router]);

  if (status !== "ready" || !user) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100svh] bg-background">
      <div className="aurora-bg" aria-hidden />
      {/* Cinematic film grain over the app, same as the landing page */}
      <div className="noise-overlay" aria-hidden />
      {/* Skip link — only visible when focused via keyboard */}
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
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
