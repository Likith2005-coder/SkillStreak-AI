"use client";

import { useEffect } from "react";
import { fetchMe } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useUserStore } from "@/store/userStore";

/**
 * Bootstraps the user from the persisted token on first mount.
 * Call once at the top of any layout that needs auth context.
 */
export function useBootstrapUser() {
  const status = useUserStore((s) => s.status);
  const setMe = useUserStore((s) => s.setMe);
  const setStatus = useUserStore((s) => s.setStatus);
  const clear = useUserStore((s) => s.clear);

  useEffect(() => {
    if (status !== "idle") return;

    const token = getToken();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    fetchMe()
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) clear();
      });

    return () => {
      cancelled = true;
    };
  }, [status, setMe, setStatus, clear]);
}

export function useUser() {
  return useUserStore((s) => s.user);
}

export function useAuthStatus() {
  return useUserStore((s) => s.status);
}
