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
    const url = err.config?.url ?? "";
    const isLoginAttempt = /\/auth\/login\b/.test(url);

    if (err.response?.status === 401 && typeof window !== "undefined") {
      // Token rejected on an authed route — drop it so route guards redirect
      // to /login. Don't clear on a failed login attempt — the user never had
      // a token to begin with, and clearing it triggers other store side-effects.
      if (!isLoginAttempt) clearToken();
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
  digestEnabled: boolean;
  onboardedAt: string;
};

export type SettingsPayload = {
  reminderTime?: string | null;
  digestEnabled?: boolean;
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

export async function updateSettings(payload: SettingsPayload): Promise<{ profile: UserProfile }> {
  const { data } = await api.patch<{ profile: UserProfile }>("/auth/me/settings", payload);
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

// ─── Interview prep ─────────────────────────────────────

export type InterviewGate = {
  eligible: boolean;
  completed: number;
  total: number;
  /** Set when admin role unlocks access regardless of completion. */
  adminOverride?: boolean;
};

export type InterviewQuestion = {
  q: string;
  category: "concept" | "system-design" | "behavioral" | "code" | "trap";
  difficulty: "easy" | "medium" | "hard";
  answer: string;
  whyAsked: string;
  starAnswer?: string;
};

export type InterviewPrep = {
  domainSlug: string;
  domainName: string;
  level: "beginner" | "intermediate" | "advanced";
  pillars: Array<{ title: string; oneLiner: string }>;
  pitfalls: string[];
  differentiators: string[];
  questions: InterviewQuestion[];
  systemDesign: Array<{ scenario: string; solutionOutline: string; followUps: string[] }>;
  weekPlan: Array<{ day: number; focus: string; deliverable: string }>;
  resources: Array<{ title: string; type: "book" | "talk" | "repo" | "blog" | "docs"; url?: string }>;
};

// ─── Career path ────────────────────────────────────────

export type CareerStage = {
  phase: number;
  title: string;
  timeframe: string;
  focus: string;
  skills: string[];
  milestone: string;
};

export type CareerCertification = {
  name: string;
  org: string;
  level: "foundation" | "intermediate" | "advanced" | "expert";
  whenToTake: string;
  cost: string;
  whyItMatters: string;
};

export type CareerRole = {
  title: string;
  seniority: "entry" | "mid" | "senior" | "lead";
  salaryRange: string;
  whenReady: string;
};

export type CareerProject = {
  title: string;
  description: string;
  skills: string[];
};

export type CareerPath = {
  domainSlug: string;
  domainName: string;
  persona: { level: string; goal: string; pace: string };
  headline: string;
  summary: string;
  stages: CareerStage[];
  certifications: CareerCertification[];
  roles: CareerRole[];
  projects: CareerProject[];
  firstSteps: string[];
};

export async function fetchCareerPath(slug: string): Promise<{
  career: CareerPath;
  cached: boolean;
  gate: InterviewGate;
}> {
  // Cold-cache generation is an LLM call producing ~3000 tokens — can take
  // 20-40s. Override the axios default timeout for this request only.
  // 403 = roadmap not fully completed yet (same gate as interview prep).
  const { data } = await api.get<{
    career: CareerPath;
    cached: boolean;
    gate: InterviewGate;
  }>(`/career/${slug}`, { timeout: 90_000 });
  return data;
}

export async function fetchInterviewStatus(slug: string): Promise<InterviewGate> {
  const { data } = await api.get<InterviewGate>(`/domains/${slug}/interview/status`);
  return data;
}

export async function fetchInterviewPrep(slug: string): Promise<{
  prep: InterviewPrep;
  cached: boolean;
  gate: InterviewGate;
}> {
  // Cold-cache generation is an LLM call producing ~3500 tokens — easily 20-40s.
  // Override the 15s axios default for this request only.
  const { data } = await api.get<{
    prep: InterviewPrep;
    cached: boolean;
    gate: InterviewGate;
  }>(`/domains/${slug}/interview`, { timeout: 90_000 });
  return data;
}

export async function fetchTopic(id: string): Promise<TopicView> {
  const { data } = await api.get<{ topic: TopicView }>(`/topics/${id}`);
  return data.topic;
}

export async function explainTopic(id: string): Promise<ExplainResponse> {
  // Cold-cache topic explainers can be ~2200 tokens — bump timeout per call.
  const { data } = await api.post<ExplainResponse>(`/topics/${id}/explain`, undefined, {
    timeout: 60_000,
  });
  return data;
}

export type CompleteTopicResponse = {
  progress: NonNullable<TopicView["progress"]>;
  gamification: GamificationDelta | null;
};

export async function completeTopic(id: string): Promise<CompleteTopicResponse> {
  const { data } = await api.post<CompleteTopicResponse>(`/topics/${id}/complete`);
  return data;
}

// ─── Ethical Hacking Arsenal (toolkit) ──────────────────

export type ToolDifficulty = "beginner" | "intermediate" | "advanced";

export type ArsenalTool = {
  slug: string;
  name: string;
  phase: string;
  category: string;
  tagline: string;
  difficulty: ToolDifficulty;
  officialUrl: string;
  tags: string[];
};

export type ArsenalPhase = {
  slug: string;
  order: number;
  name: string;
  icon: string;
  color: string;
  summary: string;
  objective: string;
  tools: ArsenalTool[];
};

export type ToolGuideResponse = {
  tool: ArsenalTool;
  phase: Omit<ArsenalPhase, "tools"> | null;
  guide: string;
  cached: boolean;
};

export async function fetchArsenal(): Promise<ArsenalPhase[]> {
  const { data } = await api.get<{ phases: ArsenalPhase[] }>("/toolkit");
  return data.phases;
}

export async function fetchTool(
  slug: string
): Promise<{ tool: ArsenalTool; phase: Omit<ArsenalPhase, "tools"> | null }> {
  const { data } = await api.get<{ tool: ArsenalTool; phase: Omit<ArsenalPhase, "tools"> | null }>(
    `/toolkit/tools/${slug}`
  );
  return data;
}

export async function fetchToolGuide(slug: string): Promise<ToolGuideResponse> {
  // Cold-cache guides can be ~2200 tokens — bump timeout per call.
  const { data } = await api.post<ToolGuideResponse>(`/toolkit/tools/${slug}/guide`, undefined, {
    timeout: 60_000,
  });
  return data;
}

// ─── Chat (Phase 3) ─────────────────────────────────────

export type Intent =
  | "explain"
  | "roadmap"
  | "quiz"
  | "recommend"
  | "doubt"
  | "motivational";

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  intent: Intent | null;
  createdAt: string;
};

export type ChatSessionSummary = {
  id: string;
  title: string;
  topicId: string | null;
  topicTitle: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ChatSessionDetail = {
  id: string;
  title: string;
  topicId: string | null;
  topicTitle: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export async function listChatSessions(): Promise<ChatSessionSummary[]> {
  const { data } = await api.get<{ sessions: ChatSessionSummary[] }>("/chat/sessions");
  return data.sessions;
}

export async function createChatSession(opts: {
  topicId?: string | null;
  title?: string;
}): Promise<ChatSessionSummary> {
  const { data } = await api.post<{ session: ChatSessionSummary }>("/chat/sessions", opts);
  return data.session;
}

export async function getChatSession(id: string): Promise<ChatSessionDetail> {
  const { data } = await api.get<{ session: ChatSessionDetail }>(`/chat/sessions/${id}`);
  return data.session;
}

export async function renameChatSession(id: string, title: string): Promise<ChatSessionSummary> {
  const { data } = await api.patch<{ session: ChatSessionSummary }>(
    `/chat/sessions/${id}`,
    { title }
  );
  return data.session;
}

export async function deleteChatSession(id: string): Promise<void> {
  await api.delete(`/chat/sessions/${id}`);
}

/**
 * Stream an assistant reply via SSE-over-fetch. Resolves when the stream ends.
 *
 * Native EventSource doesn't support custom headers (no Authorization), so we
 * use fetch + ReadableStream and parse SSE frames manually.
 */
export type StreamCallbacks = {
  onIntent?: (intent: Intent) => void;
  onDelta: (text: string) => void;
  onDone: (info: { messageId: string; followUps: string[] }) => void;
  onError?: (err: { error: string; status?: number }) => void;
};

// ─── Resources & Recommendations (Phase 7) ──────────────

export type ResourceItem = {
  id: string;
  type: "video" | "doc";
  title: string;
  url: string;
  source: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
};

export type ResourcesResponse = {
  videos: ResourceItem[];
  docs: ResourceItem[];
  cached: boolean;
};

export type RecommendedTopic = {
  topicId: string;
  title: string;
  summary: string;
  phase: "foundations" | "core" | "advanced";
  domain: { slug: string; name: string; color: string; icon: string };
  similarity: number;
  reason: "personalized" | "fallback_unstarted";
};

export async function fetchResources(topicId: string): Promise<ResourcesResponse> {
  const { data } = await api.get<ResourcesResponse>(`/resources/topics/${topicId}`);
  return data;
}

export async function fetchRecommendations(limit = 6): Promise<RecommendedTopic[]> {
  const { data } = await api.get<{ recommendations: RecommendedTopic[] }>(
    `/resources/recommendations?limit=${limit}`
  );
  return data.recommendations;
}

// ─── Gamification (Phase 6) ─────────────────────────────

export type Streak = {
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
  lastActiveDate: string | null;
};

export type Badge = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string | null;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  level: number;
  xpTotal: number;
  xpThisWeek: number;
};

export type XpEventDelta = {
  amount: number;
  reason: "topic_complete" | "first_topic_of_day" | "quiz_pass" | "quiz_perfect" | "streak_day" | "comeback";
  meta?: Record<string, unknown>;
};

export type GamificationDelta = {
  xp: { totalAwarded: number; newXp: number; oldLevel: number; newLevel: number; events: XpEventDelta[] };
  streak: {
    current: number;
    longest: number;
    freezesAvailable: number;
    changedToday: boolean;
    comebackBonus: boolean;
    freezeUsed: boolean;
  };
  badges: Array<{ slug: string; name: string; description: string; icon: string; earnedAt: string }>;
};

export async function fetchStreak(): Promise<Streak> {
  const { data } = await api.get<Streak>("/streak");
  return data;
}

export async function spendStreakFreeze(): Promise<{ remaining: number }> {
  const { data } = await api.post<{ remaining: number }>("/streak/freeze");
  return data;
}

export async function fetchBadges(): Promise<Badge[]> {
  const { data } = await api.get<{ badges: Badge[] }>("/badges");
  return data.badges;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await api.get<{ entries: LeaderboardEntry[] }>("/leaderboard");
  return data.entries;
}

// ─── Progress / Analytics (Phase 5) ─────────────────────

export type DomainProgressTile = {
  slug: string;
  name: string;
  color: string;
  icon: string;
  done: number;
  total: number;
  avgScore: number | null;
};

export type WeakArea = {
  topicId: string;
  title: string;
  bestScore: number | null;
  domain: { slug: string; name: string; color: string };
};

export type RecentAttempt = {
  id: string;
  topicId: string;
  topicTitle: string;
  domain: { slug: string; name: string; color: string };
  score: number;
  total: number;
  passed: boolean;
  attemptedAt: string;
};

export type ProgressOverview = {
  user: { id: string; name: string; level: number; xp: number; memberSince: string };
  totals: { topicsCompleted: number; topicsAvailable: number; attempts: number };
  perDomain: DomainProgressTile[];
  weakAreas: WeakArea[];
  recentAttempts: RecentAttempt[];
  recommended: { topicId: string; topicTitle: string; domain: { slug: string; name: string; color: string } } | null;
};

export type DomainProgressDetail = {
  domain: { slug: string; name: string; color: string; icon: string };
  totals: { topicsCompleted: number; topicsAvailable: number };
  quiz: {
    attempts: number;
    passes: number;
    avgScore: number | null;
    trend: Array<{ date: string; score: number; total: number }>;
  };
  topics: Array<{
    id: string;
    orderIndex: number;
    title: string;
    phase: "foundations" | "core" | "advanced";
    status: "not_started" | "in_progress" | "completed";
    bestScore: number | null;
    completedAt: string | null;
  }>;
};

export type HeatmapData = {
  days: Array<{ date: string; count: number }>;
  totalActiveDays: number;
  totalActions: number;
};

export async function fetchOverview(): Promise<ProgressOverview> {
  const { data } = await api.get<ProgressOverview>("/progress");
  return data;
}

export async function fetchDomainProgress(slug: string): Promise<DomainProgressDetail> {
  const { data } = await api.get<DomainProgressDetail>(`/progress/domain/${slug}`);
  return data;
}

export async function fetchHeatmap(): Promise<HeatmapData> {
  const { data } = await api.get<HeatmapData>("/progress/heatmap");
  return data;
}

// ─── Quiz (Phase 4) ─────────────────────────────────────

export type QuizLevel = "beginner" | "intermediate" | "advanced";

export type QuizQuestionPublic = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type QuizGenerateResponse = {
  topicId: string;
  level: QuizLevel;
  cached: boolean;
  questions: QuizQuestionPublic[];
};

export type QuizBreakdownItem = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  selectedIndex: number;
  correct: boolean;
};

export type QuizSubmitResponse = {
  attempt: { id: string; score: number; total: number; passed: boolean; attemptedAt: string };
  breakdown: QuizBreakdownItem[];
  passed: boolean;
  score: number;
  total: number;
  gamification: GamificationDelta | null;
};

export type QuizHistoryAttempt = {
  id: string;
  topicId: string;
  topicTitle: string;
  domain: { slug: string; name: string };
  level: QuizLevel;
  score: number;
  total: number;
  passed: boolean;
  attemptedAt: string;
};

export async function generateQuiz(topicId: string, fresh = false): Promise<QuizGenerateResponse> {
  const { data } = await api.post<QuizGenerateResponse>(
    `/quiz/topics/${topicId}/generate`,
    { fresh }
  );
  return data;
}

export async function submitQuiz(
  topicId: string,
  answers: number[]
): Promise<QuizSubmitResponse> {
  const { data } = await api.post<QuizSubmitResponse>(
    `/quiz/topics/${topicId}/submit`,
    { answers }
  );
  return data;
}

export async function fetchQuizHistory(): Promise<QuizHistoryAttempt[]> {
  const { data } = await api.get<{ attempts: QuizHistoryAttempt[] }>("/quiz/history");
  return data.attempts;
}

export async function streamChatMessage(
  sessionId: string,
  message: string,
  cbs: StreamCallbacks,
  opts?: { regenerate?: boolean; signal?: AbortSignal }
): Promise<void> {
  const token = getToken();
  const res = await fetch(`${baseURL}/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, regenerate: opts?.regenerate ?? false }),
    signal: opts?.signal,
  });

  if (!res.ok || !res.body) {
    let errorMessage = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) errorMessage = data.error;
    } catch {
      /* ignore parse failure */
    }
    cbs.onError?.({ error: errorMessage, status: res.status });
    throw new Error(errorMessage);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // SSE frames are separated by a blank line. Each frame has lines like:
  //   event: delta
  //   data: {"type":"delta","text":"..."}
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      if (!frame.trim() || frame.startsWith(":")) continue;

      let event = "message";
      const dataLines: string[] = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      if (!dataLines.length) continue;

      let payload: { type?: string; text?: string; intent?: Intent; messageId?: string; followUps?: string[]; error?: string; status?: number };
      try {
        payload = JSON.parse(dataLines.join("\n"));
      } catch {
        continue;
      }

      if (event === "delta" && typeof payload.text === "string") {
        cbs.onDelta(payload.text);
      } else if (event === "intent" && payload.intent) {
        cbs.onIntent?.(payload.intent);
      } else if (event === "done" && payload.messageId) {
        cbs.onDone({
          messageId: payload.messageId,
          followUps: payload.followUps ?? [],
        });
      } else if (event === "error") {
        cbs.onError?.({
          error: payload.error ?? "Stream error",
          status: payload.status,
        });
      }
    }
  }
}
