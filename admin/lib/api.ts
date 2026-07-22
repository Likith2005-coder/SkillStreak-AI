/**
 * Admin API client. Talks to the SAME backend as the main app, so every change
 * made here writes to the shared database and shows up on the learner site.
 * Auth is a stateless JWT (Bearer header) kept in localStorage.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const TOKEN_KEY = "skillstreak_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function req<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !path.includes("/auth/login")) {
      window.location.href = "/login";
    }
    throw new Error("Session expired — please sign in again.");
  }

  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((body && (body.message || body.error)) || `Request failed (${res.status})`);
  }
  return body as T;
}

// ─── Types ──────────────────────────────────────────────────

export type Me = { user: { id: string; email: string; name: string; role: "user" | "admin" } };

export type AdminTopic = {
  id: string;
  title: string;
  summary: string;
  difficulty: "easy" | "standard" | "hard";
  phase: "foundations" | "core" | "advanced";
  orderIndex: number;
  roadmapId: string;
  domain: { slug: string; name: string; color: string };
  completedBy: number;
  quizAttempts: number;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  level: number;
  xp: number;
  createdAt: string;
  topicsCompleted: number;
  quizAttempts: number;
  currentStreak: number;
  longestStreak: number;
};

// Mirrors the backend `getMetrics()` shape (nested groups), see
// backend/src/services/admin.service.ts.
export type Metrics = {
  users: {
    total: number;
    newLast24h: number;
    newLast30d: number;
    activeLast24h: number;
    activeLast30d: number;
  };
  learning: {
    topicsCompleted: number;
    topicsCompletedLast24h: number;
    quizAttempts: number;
    quizAttemptsLast24h: number;
  };
  popular: {
    topicId: string;
    title: string;
    domain: { name: string; color: string };
    completions: number;
  }[];
};

// ─── Endpoints ──────────────────────────────────────────────

export const api = {
  login: (email: string, password: string) =>
    req<{ token: string; user: Me["user"] }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => req<Me>("/auth/me"),

  metrics: () => req<Metrics>("/admin/metrics"),

  listTopics: (params?: { domainSlug?: string; phase?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.domainSlug) q.set("domainSlug", params.domainSlug);
    if (params?.phase) q.set("phase", params.phase);
    if (params?.search) q.set("search", params.search);
    const qs = q.toString();
    return req<{ topics: AdminTopic[] }>(`/admin/topics${qs ? `?${qs}` : ""}`);
  },
  createTopic: (b: {
    domainSlug: string;
    title: string;
    summary: string;
    difficulty: string;
    phase: string;
  }) => req<{ topic: AdminTopic }>("/admin/topics", { method: "POST", body: JSON.stringify(b) }),
  updateTopic: (
    id: string,
    b: { title?: string; summary?: string; difficulty?: string; phase?: string }
  ) => req<{ topic: AdminTopic }>(`/admin/topics/${id}`, { method: "PATCH", body: JSON.stringify(b) }),
  deleteTopic: (id: string) => req<null>(`/admin/topics/${id}`, { method: "DELETE" }),

  listUsers: () => req<{ users: AdminUser[] }>("/admin/users"),
  updateUser: (id: string, b: { role?: "user" | "admin"; name?: string }) =>
    req<{ user: AdminUser }>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(b) }),
  deleteUser: (id: string) => req<null>(`/admin/users/${id}`, { method: "DELETE" }),
  resetProgress: (id: string) =>
    req<{ reset: true }>(`/admin/users/${id}/reset-progress`, { method: "POST" }),

  emailStatus: () => req<{ configured: boolean }>("/admin/email/status"),
  testStreak: () => req<unknown>("/admin/email/test/streak", { method: "POST" }),
  testDigest: () => req<unknown>("/admin/email/test/digest", { method: "POST" }),
  dispatchStreaks: () => req<unknown>("/admin/email/dispatch/streaks", { method: "POST" }),
  dispatchDigests: () => req<unknown>("/admin/email/dispatch/digests", { method: "POST" }),
};
