"use client";

import { useEffect } from "react";
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
    fetchMe()
      .then((data) => setMe(data))
      .catch(() => clear());
  }, [setMe, setStatus, clear]);
}

export function useUser() {
  return useUserStore((s) => s.user);
}

export function useAuthStatus() {
  return useUserStore((s) => s.status);
}
