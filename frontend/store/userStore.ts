"use client";

import { create } from "zustand";
import type { MeResponse, PublicUser, UserProfile } from "@/lib/api";
import { clearToken, setToken } from "@/lib/auth";

type AuthUser = PublicUser & { profile: UserProfile | null };

type Status = "idle" | "loading" | "ready" | "unauthenticated";

type UserState = {
  user: AuthUser | null;
  status: Status;
  setAuth: (user: PublicUser, token: string) => void;
  setMe: (data: MeResponse) => void;
  setStatus: (status: Status) => void;
  clear: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  status: "idle",
  setAuth: (user, token) => {
    setToken(token);
    set({
      user: { ...user, profile: null },
      status: "ready",
    });
  },
  setMe: ({ user }) => {
    set({ user, status: "ready" });
  },
  setStatus: (status) => set({ status }),
  clear: () => {
    clearToken();
    set({ user: null, status: "unauthenticated" });
  },
}));
