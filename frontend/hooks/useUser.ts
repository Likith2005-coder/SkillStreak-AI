"use client";

import { useEffect } from "react";
import { isAxiosError } from "axios";
import { fetchMe } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useUserStore } from "@/store/userStore";

/**
 * Bootstraps the user from the persisted token on first mount.
 * Call once at the top of any layout that needs auth context.
 *
 * Reads `status` via getState() rather than subscribing, so the effect
 * doesn't re-run when status transitions idle → loading and cancel its
 * own in-flight fetch.
 */
export function useBootstrapUser() {
  const setMe = useUserStore((s) => s.setMe);
  const setStatus = useUserStore((s) => s.setStatus);
  const clear = useUserStore((s) => s.clear);

  useEffect(() => {
    if (useUserStore.getState().status !== "idle") return;

    const token = getToken();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    setStatus("loading");
    // Only a real auth rejection (401/403) logs the user out. A rate limit
    // (429), a network blip or a restarting server is retried, and the token
    // is kept, so a busy shared network can't sign everyone out.
    const attempt = (n: number) => {
      fetchMe()
        .then((data) => setMe(data))
        .catch((err) => {
          const status = isAxiosError(err) ? err.response?.status : undefined;
          if (status === 401 || status === 403) return clear();
          if (n < 3) return void setTimeout(() => attempt(n + 1), 1500 * 2 ** n);
          setStatus("unauthenticated"); // give up for now; the token stays for the next load
        });
    };
    attempt(0);
  }, [setMe, setStatus, clear]);
}

export function useUser() {
  return useUserStore((s) => s.user);
}

export function useAuthStatus() {
  return useUserStore((s) => s.status);
}
