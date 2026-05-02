import axios, { AxiosError } from "axios";
import { clearToken, getToken } from "./auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      // Token rejected — drop it so route guards redirect to /login.
      clearToken();
    }
    return Promise.reject(err);
  }
);

// ─── Health ─────────────────────────────────────────────

export type HealthResponse = {
  status: "ok" | "degraded";
  service: string;
  timestamp: string;
  checks: {
    database: "up" | "down";
    redis: "up" | "down" | "in-memory";
  };
};

export async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    const { data } = await api.get<HealthResponse>("/health");
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      return err.response.data as HealthResponse;
    }
    return null;
  }
}

// ─── Auth ───────────────────────────────────────────────

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  level: number;
  xp: number;
  createdAt: string;
};

export type UserProfile = {
  priorLevel: "none" | "some" | "experienced";
  goal: "interview" | "awareness" | "curiosity";
  pace: "relaxed" | "standard" | "intense";
  preferredDomains: string[];
  reminderTime: string | null;
  onboardedAt: string;
};

export type MeResponse = { user: PublicUser & { profile: UserProfile | null } };
export type AuthResponse = { user: PublicUser; token: string };

export type RegisterPayload = { email: string; password: string; name: string };
export type LoginPayload = { email: string; password: string };
export type ProfilePayload = {
  priorLevel: UserProfile["priorLevel"];
  goal: UserProfile["goal"];
  pace: UserProfile["pace"];
  preferredDomains?: string[];
  reminderTime?: string | null;
};

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/auth/me");
  return data;
}

export async function updateProfile(payload: ProfilePayload): Promise<{ profile: UserProfile }> {
  const { data } = await api.patch<{ profile: UserProfile }>("/auth/me/profile", payload);
  return data;
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // best-effort; token is already being dropped client-side
  }
}

// Pulls a user-friendly message out of an axios error.
export function apiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; details?: unknown } | undefined;
    if (data?.error) return data.error;
    if (err.message) return err.message;
  }
  return fallback;
}

// ─── Domains & Topics (Phase 2) ─────────────────────────

export type Domain = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: "beginner" | "intermediate" | "mixed";
  isCurated: boolean;
  orderIndex: number;
  roadmap?: { totalTopics: number; estimatedDays: number } | null;
};

export type RoadmapTopic = {
  id: string;
  orderIndex: number;
  title: string;
  summary: string;
  difficulty: "easy" | "standard" | "hard";
  phase: "foundations" | "core" | "advanced";
};

export type RoadmapView = Domain & {
  roadmap: {
    id: string;
    title: string;
    totalTopics: number;
    estimatedDays: number;
    topics: RoadmapTopic[];
  } | null;
  progress: Array<{
    topicId: string;
    status: "not_started" | "in_progress" | "completed";
    bestScore: number | null;
    completedAt: string | null;
  }>;
};

export type TopicView = RoadmapTopic & {
  roadmap: {
    id: string;
    title: string;
    domain: { id: string; slug: string; name: string; color: string; icon: string };
  };
  progress: {
    status: "not_started" | "in_progress" | "completed";
    bestScore: number | null;
    completedAt: string | null;
    timeSpentSeconds: number;
  } | null;
};

export type ExplainResponse = {
  explanation: string;
  level: "beginner" | "intermediate" | "advanced";
  cached: boolean;
};

export async function fetchDomains(): Promise<Domain[]> {
  const { data } = await api.get<{ domains: Domain[] }>("/domains");
  return data.domains;
}

export async function fetchRoadmap(slug: string): Promise<RoadmapView> {
  const { data } = await api.get<{ domain: RoadmapView }>(`/roadmap/${slug}`);
  return data.domain;
}

export async function fetchTopic(id: string): Promise<TopicView> {
  const { data } = await api.get<{ topic: TopicView }>(`/topics/${id}`);
  return data.topic;
}

export async function explainTopic(id: string): Promise<ExplainResponse> {
  const { data } = await api.post<ExplainResponse>(`/topics/${id}/explain`);
  return data;
}

export async function completeTopic(id: string): Promise<TopicView["progress"]> {
  const { data } = await api.post<{ progress: NonNullable<TopicView["progress"]> }>(
    `/topics/${id}/complete`
  );
  return data.progress;
}
