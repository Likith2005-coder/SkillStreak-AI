"use client";

/**
 * Admin Power Panel.
 *
 * Five tabs, every important action wired:
 *  1. Overview   — platform metrics, popular topics, links to every page
 *  2. Topics     — domain dropdown → topic list → add / edit / delete
 *  3. Users      — full user list with role toggle, reset progress, delete
 *  4. Content    — per-domain interview-prep regenerate buttons + quick nav
 *  5. Notifications — email status + manual streak/digest dispatch
 *
 * Designed so the admin never has to scroll past 500 topics to find one.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Briefcase,
  Bot,
  ChartLine,
  Check,
  Filter,
  Layers,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminCreateTopic,
  adminDeleteTopic,
  adminDeleteUser,
  adminDispatchDigests,
  adminDispatchStreaks,
  adminEmailStatus,
  adminListTopics,
  adminListUsers,
  adminMetrics,
  adminRegenerateInterview,
  adminResetUserProgress,
  adminSendTestDigest,
  adminSendTestStreak,
  adminUpdateTopic,
  adminUpdateUser,
  apiErrorMessage,
  fetchDomains,
  type AdminMetrics,
  type AdminTopic,
  type AdminUser,
  type Domain,
} from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

type TabId = "overview" | "topics" | "users" | "content" | "notifications";

export default function AdminPage() {
  const user = useUserStore((s) => s.user);
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");

  // Role gate (server enforces 403 anyway).
  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/dashboard");
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return (
      <main className="container flex min-h-[60vh] items-center justify-center px-4 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </main>
    );
  }

  return (
    <main className="container px-4 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <header className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-card/50 p-6 backdrop-blur sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-[0.2em] text-primary">
            Admin · Power panel
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            You own everything here.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage users, edit any topic, regenerate interview prep, fire emails.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <nav className="mt-6 flex flex-wrap gap-1 border-b border-border">
        <TabButton id="overview" current={tab} onClick={setTab} icon={<ChartLine className="h-4 w-4" />}>
          Overview
        </TabButton>
        <TabButton id="topics" current={tab} onClick={setTab} icon={<BookOpen className="h-4 w-4" />}>
          Topics
        </TabButton>
        <TabButton id="users" current={tab} onClick={setTab} icon={<Users className="h-4 w-4" />}>
          Users
        </TabButton>
        <TabButton id="content" current={tab} onClick={setTab} icon={<Briefcase className="h-4 w-4" />}>
          Content
        </TabButton>
        <TabButton id="notifications" current={tab} onClick={setTab} icon={<Mail className="h-4 w-4" />}>
          Notifications
        </TabButton>
      </nav>

      <section className="mt-6 mb-16">
        {tab === "overview" && <OverviewTab />}
        {tab === "topics" && <TopicsTab />}
        {tab === "users" && <UsersTab actingUserId={user.id} />}
        {tab === "content" && <ContentTab />}
        {tab === "notifications" && <NotificationsTab />}
      </section>
    </main>
  );
}

function TabButton({
  id,
  current,
  onClick,
  icon,
  children,
}: {
  id: TabId;
  current: TabId;
  onClick: (id: TabId) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const active = current === id;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={cn(
        "inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// OVERVIEW TAB
// ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminMetrics()
      .then((m) => !cancelled && setMetrics(m))
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Failed to load metrics")));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!metrics) return <SpinnerBox />;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4 text-violet-300" />} label="Total users" value={metrics.users.total} sub={`+${metrics.users.newLast24h} today · +${metrics.users.newLast30d} this month`} />
        <StatCard icon={<Sparkles className="h-4 w-4 text-emerald-300" />} label="Active 24h" value={metrics.users.activeLast24h} sub={`${metrics.users.activeLast30d} active in 30 days`} />
        <StatCard icon={<BookOpen className="h-4 w-4 text-rose-300" />} label="Topics completed" value={metrics.learning.topicsCompleted} sub={`+${metrics.learning.topicsCompletedLast24h} today`} />
        <StatCard icon={<Trophy className="h-4 w-4 text-amber-300" />} label="Quiz attempts" value={metrics.learning.quizAttempts} sub={`+${metrics.learning.quizAttemptsLast24h} today`} />
      </div>

      <div className="rounded-2xl border border-border bg-card/50 p-6">
        <h2 className="text-sm font-semibold tracking-tight">Most popular topics (all-time)</h2>
        {metrics.popular.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No completions yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {metrics.popular.map((p, i) => (
              <li key={p.topicId} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground w-5 text-right">{i + 1}.</span>
                <span className="flex-1 truncate text-foreground">{p.title}</span>
                <span className="text-xs text-muted-foreground">{p.domain.name}</span>
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {p.completions}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card/50 p-6">
        <h2 className="text-sm font-semibold tracking-tight">Jump anywhere</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink href="/dashboard" icon={<ChartLine className="h-4 w-4" />} label="User dashboard" />
          <QuickLink href="/domains" icon={<BookOpen className="h-4 w-4" />} label="Domains gallery" />
          <QuickLink href="/chatbot" icon={<Bot className="h-4 w-4" />} label="AI chatbot" />
          <QuickLink href="/leaderboard" icon={<Trophy className="h-4 w-4" />} label="Leaderboard" />
          <QuickLink href="/progress" icon={<TrendingUp className="h-4 w-4" />} label="Progress page" />
          <QuickLink href="/settings" icon={<ShieldCheck className="h-4 w-4" />} label="Settings" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center justify-between gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm text-foreground transition hover:border-primary/40 hover:bg-card/70"
    >
      <span className="inline-flex items-center gap-2">
        <span className="text-muted-foreground group-hover:text-foreground">{icon}</span>
        {label}
      </span>
      <span className="text-muted-foreground transition group-hover:translate-x-0.5">→</span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// TOPICS TAB — domain dropdown → filtered list → add/edit/delete
// ─────────────────────────────────────────────────────────────

function TopicsTab() {
  const [domains, setDomains] = useState<Domain[] | null>(null);
  const [topics, setTopics] = useState<AdminTopic[] | null>(null);
  const [domainSlug, setDomainSlug] = useState<string>("");
  const [phase, setPhase] = useState<"" | "foundations" | "core" | "advanced">("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchDomains()
      .then((d) => setDomains(d.filter((x) => x.isCurated)))
      .catch((err) => setError(apiErrorMessage(err, "Failed to load domains")));
  }, []);

  // Default to the first curated domain so the admin sees something useful immediately.
  useEffect(() => {
    if (!domainSlug && domains && domains.length > 0) {
      setDomainSlug(domains[0].slug);
    }
  }, [domains, domainSlug]);

  useEffect(() => {
    if (!domainSlug) return;
    setLoading(true);
    adminListTopics({
      domainSlug,
      phase: phase || undefined,
      search: search.trim() || undefined,
    })
      .then((t) => {
        setTopics(t);
        setLoading(false);
      })
      .catch((err) => {
        setError(apiErrorMessage(err, "Failed to load topics"));
        setLoading(false);
      });
  }, [domainSlug, phase, search]);

  function patchTopic(id: string, patch: Partial<AdminTopic>) {
    setTopics((cur) => cur?.map((t) => (t.id === id ? { ...t, ...patch } : t)) ?? null);
  }
  function removeTopic(id: string) {
    setTopics((cur) => cur?.filter((t) => t.id !== id) ?? null);
  }

  if (error) return <ErrorBox message={error} />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <Label className="text-xs">Domain</Label>
          <select
            value={domainSlug}
            onChange={(e) => setDomainSlug(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {domains?.map((d) => (
              <option key={d.id} value={d.slug}>
                {d.name} ({d.roadmap?.totalTopics ?? 0} topics)
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Phase</Label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as typeof phase)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm sm:w-44"
          >
            <option value="">All phases</option>
            <option value="foundations">Foundations</option>
            <option value="core">Core</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="flex-1">
          <Label className="text-xs">Search</Label>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title or summary…"
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New topic
        </Button>
      </div>

      {loading && <SpinnerBox />}

      {!loading && topics && topics.length === 0 && (
        <EmptyBox icon={<Filter className="h-5 w-5" />} message="No topics match those filters." />
      )}

      {!loading && topics && topics.length > 0 && (
        <ul className="space-y-2">
          {topics.map((t) => (
            <TopicRow
              key={t.id}
              topic={t}
              onChange={(patch) => patchTopic(t.id, patch)}
              onDelete={() => removeTopic(t.id)}
            />
          ))}
        </ul>
      )}

      {showCreate && domains && (
        <CreateTopicDialog
          domains={domains}
          defaultDomain={domainSlug}
          onClose={() => setShowCreate(false)}
          onCreated={(t) => {
            setShowCreate(false);
            toast.success("Topic created");
            // Reload if the new topic belongs to the current filter
            if (t.domain.slug === domainSlug) {
              setTopics((cur) => (cur ? [...cur, t] : [t]));
            }
          }}
        />
      )}
    </div>
  );
}

function TopicRow({
  topic,
  onChange,
  onDelete,
}: {
  topic: AdminTopic;
  onChange: (patch: Partial<AdminTopic>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: topic.title,
    summary: topic.summary,
    difficulty: topic.difficulty,
    phase: topic.phase,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const { topic: updated } = await adminUpdateTopic(topic.id, draft);
      onChange({
        title: updated.title,
        summary: updated.summary,
        difficulty: updated.difficulty,
        phase: updated.phase,
      });
      setEditing(false);
      toast.success("Saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete topic "${topic.title}"? This can't be undone.`)) return;
    try {
      await adminDeleteTopic(topic.id);
      onDelete();
      toast.success("Topic deleted");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Delete failed"));
    }
  }

  return (
    <li className="rounded-xl border border-border bg-card/40 p-4">
      {!editing ? (
        <div className="flex items-start gap-3">
          <span className="inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded bg-muted/50 px-1 text-[11px] tabular-nums text-muted-foreground">
            #{topic.orderIndex}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{topic.title}</h3>
              <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {topic.phase}
              </span>
              <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {topic.difficulty}
              </span>
              <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                ✅ {topic.completedBy} · 🧠 {topic.quizAttempts}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{topic.summary}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={remove} aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Title"
          />
          <textarea
            value={draft.summary}
            onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            placeholder="Summary"
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={draft.phase}
              onChange={(e) => setDraft({ ...draft, phase: e.target.value as typeof draft.phase })}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="foundations">Foundations</option>
              <option value="core">Core</option>
              <option value="advanced">Advanced</option>
            </select>
            <select
              value={draft.difficulty}
              onChange={(e) =>
                setDraft({ ...draft, difficulty: e.target.value as typeof draft.difficulty })
              }
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="easy">Easy</option>
              <option value="standard">Standard</option>
              <option value="hard">Hard</option>
            </select>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <Check className="h-3.5 w-3.5" /> Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function CreateTopicDialog({
  domains,
  defaultDomain,
  onClose,
  onCreated,
}: {
  domains: Domain[];
  defaultDomain: string;
  onClose: () => void;
  onCreated: (topic: AdminTopic) => void;
}) {
  const [draft, setDraft] = useState({
    domainSlug: defaultDomain,
    title: "",
    summary: "",
    difficulty: "standard" as "easy" | "standard" | "hard",
    phase: "core" as "foundations" | "core" | "advanced",
  });
  const [saving, setSaving] = useState(false);

  const valid = draft.title.trim().length > 0 && draft.summary.trim().length > 0;

  async function create() {
    if (!valid) return;
    setSaving(true);
    try {
      const { topic } = await adminCreateTopic(draft);
      const domain = domains.find((d) => d.slug === draft.domainSlug);
      onCreated({
        ...topic,
        domain: domain
          ? { slug: domain.slug, name: domain.name, color: domain.color }
          : { slug: "", name: "", color: "indigo" },
        completedBy: 0,
        quizAttempts: 0,
      });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Create failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">New topic</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs">Domain</Label>
            <select
              value={draft.domainSlug}
              onChange={(e) => setDraft({ ...draft, domainSlug: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {domains.map((d) => (
                <option key={d.id} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Title</Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Zero Trust Architecture"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Summary</Label>
            <textarea
              value={draft.summary}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              placeholder="1–2 sentences that introduce the topic"
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Phase</Label>
              <select
                value={draft.phase}
                onChange={(e) => setDraft({ ...draft, phase: e.target.value as typeof draft.phase })}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="foundations">Foundations</option>
                <option value="core">Core</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Difficulty</Label>
              <select
                value={draft.difficulty}
                onChange={(e) =>
                  setDraft({ ...draft, difficulty: e.target.value as typeof draft.difficulty })
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="easy">Easy</option>
                <option value="standard">Standard</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={create} disabled={!valid || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create topic
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// USERS TAB
// ─────────────────────────────────────────────────────────────

function UsersTab({ actingUserId }: { actingUserId: string }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reload() {
    adminListUsers()
      .then(setUsers)
      .catch((err) => setError(apiErrorMessage(err, "Failed to load users")));
  }
  useEffect(reload, []);

  const filtered = useMemo(() => {
    if (!users) return null;
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (error) return <ErrorBox message={error} />;
  if (!users) return <SpinnerBox />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label className="text-xs">Search users</Label>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email…"
              className="pl-9"
            />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {filtered?.length ?? 0} of {users.length}
        </div>
      </div>

      <ul className="space-y-2">
        {filtered?.map((u) => (
          <UserRow
            key={u.id}
            u={u}
            actingUserId={actingUserId}
            onChange={(patch) =>
              setUsers((cur) => cur?.map((x) => (x.id === u.id ? { ...x, ...patch } : x)) ?? null)
            }
            onDelete={() => setUsers((cur) => cur?.filter((x) => x.id !== u.id) ?? null)}
          />
        ))}
      </ul>
    </div>
  );
}

function UserRow({
  u,
  actingUserId,
  onChange,
  onDelete,
}: {
  u: AdminUser;
  actingUserId: string;
  onChange: (patch: Partial<AdminUser>) => void;
  onDelete: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const isSelf = u.id === actingUserId;

  async function toggleRole() {
    if (isSelf) return;
    const next = u.role === "admin" ? "user" : "admin";
    setBusy(true);
    try {
      const { user } = await adminUpdateUser(u.id, { role: next });
      onChange({ role: user.role });
      toast.success(`Role updated to ${user.role}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Update failed"));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!confirm(`Wipe all progress, XP, badges, and quiz attempts for ${u.email}?`)) return;
    setBusy(true);
    try {
      await adminResetUserProgress(u.id);
      onChange({ level: 1, xp: 0, topicsCompleted: 0, quizAttempts: 0, currentStreak: 0, longestStreak: 0 });
      toast.success("User progress reset");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Reset failed"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (isSelf) return;
    if (!confirm(`Permanently delete ${u.email}? This deletes their progress, sessions, badges — everything. Cannot be undone.`)) return;
    setBusy(true);
    try {
      await adminDeleteUser(u.id);
      onDelete();
      toast.success("User deleted");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Delete failed"));
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4 sm:flex-row sm:items-center">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
        {u.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{u.name}</span>
          {u.role === "admin" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
              <ShieldCheck className="h-3 w-3" />
              Admin
            </span>
          )}
          {isSelf && (
            <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              You
            </span>
          )}
        </div>
        <div className="truncate text-xs text-muted-foreground">{u.email}</div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] tabular-nums text-muted-foreground">
          <span>Lv {u.level} · {u.xp} XP</span>
          <span>✅ {u.topicsCompleted} topics</span>
          <span>🧠 {u.quizAttempts} quizzes</span>
          <span>🔥 {u.currentStreak}d · best {u.longestStreak}d</span>
          <span>Since {new Date(u.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={toggleRole} disabled={busy || isSelf} title={isSelf ? "You can't demote yourself" : ""}>
          <ShieldCheck className="h-3.5 w-3.5" />
          {u.role === "admin" ? "Demote" : "Promote"}
        </Button>
        <Button size="sm" variant="ghost" onClick={reset} disabled={busy}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button size="sm" variant="ghost" onClick={remove} disabled={busy || isSelf} title={isSelf ? "You can't delete yourself" : ""}>
          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
          Delete
        </Button>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// CONTENT TAB — interview prep regen per domain
// ─────────────────────────────────────────────────────────────

function ContentTab() {
  const [domains, setDomains] = useState<Domain[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchDomains()
      .then((d) => setDomains(d.filter((x) => x.isCurated)))
      .catch((err) => setError(apiErrorMessage(err, "Failed to load domains")));
  }, []);

  async function regen(slug: string) {
    setBusy(slug);
    try {
      await adminRegenerateInterview(slug);
      toast.success("Interview prep cache cleared — next request regenerates fresh");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Regenerate failed"));
    } finally {
      setBusy(null);
    }
  }

  if (error) return <ErrorBox message={error} />;
  if (!domains) return <SpinnerBox />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <h2 className="text-sm font-semibold tracking-tight">Interview prep · per domain</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Clears the LLM cache so the next visit by any user regenerates a fresh
          interview-prep brief for that domain.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {domains.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-4"
          >
            <Briefcase className="h-5 w-5 shrink-0 text-violet-300" />
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{d.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {d.roadmap?.totalTopics ?? 0} topics
              </div>
            </div>
            <div className="flex gap-1">
              <Button asChild size="sm" variant="ghost">
                <Link href={`/domains/${d.slug}/interview`} title="Open prep">
                  <Layers className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => regen(d.slug)}
                disabled={busy === d.slug}
                title="Regenerate"
              >
                {busy === d.slug ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS TAB
// ─────────────────────────────────────────────────────────────

function NotificationsTab() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    adminEmailStatus()
      .then((s) => setConfigured(s.configured))
      .catch(() => setConfigured(false));
  }, []);

  async function fire(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    try {
      await fn();
      toast.success(`${label}: done`);
    } catch (err) {
      toast.error(apiErrorMessage(err, `${label} failed`));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border p-4",
          configured
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            : "border-amber-500/30 bg-amber-500/10 text-amber-200"
        )}
      >
        {configured ? (
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <div className="flex-1 text-sm">
          {configured
            ? "RESEND_API_KEY is configured — emails will actually send."
            : "RESEND_API_KEY is NOT configured — buttons below will succeed but no email goes out (no-op fallback)."}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ActionCard
          icon={<Send className="h-4 w-4 text-rose-300" />}
          title="Send streak reminder to me"
          subtitle="Tests the template + delivery path"
          onClick={() => fire("Test streak", adminSendTestStreak)}
          loading={busy === "Test streak"}
        />
        <ActionCard
          icon={<Send className="h-4 w-4 text-violet-300" />}
          title="Send weekly digest to me"
          subtitle="Same template users get on Sunday"
          onClick={() => fire("Test digest", adminSendTestDigest)}
          loading={busy === "Test digest"}
        />
        <ActionCard
          icon={<Mail className="h-4 w-4 text-amber-300" />}
          title="Dispatch streak reminders"
          subtitle="Fan out to every eligible user now"
          onClick={() => fire("Dispatch reminders", adminDispatchStreaks)}
          loading={busy === "Dispatch reminders"}
        />
        <ActionCard
          icon={<Mail className="h-4 w-4 text-emerald-300" />}
          title="Dispatch weekly digests"
          subtitle="Fan out the weekly summary now"
          onClick={() => fire("Dispatch digests", adminDispatchDigests)}
          loading={busy === "Dispatch digests"}
        />
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
  loading,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 disabled:opacity-60"
    >
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </button>
  );
}

// ─── shared helpers ─────────────────────────────────────────

function SpinnerBox() {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-border bg-card/30 py-12 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}

function EmptyBox({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/30 py-12 text-muted-foreground">
      {icon}
      <p className="text-sm">{message}</p>
    </div>
  );
}
