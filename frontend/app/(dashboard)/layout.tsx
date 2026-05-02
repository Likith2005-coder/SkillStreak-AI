"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
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
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
    </div>
  );
}
