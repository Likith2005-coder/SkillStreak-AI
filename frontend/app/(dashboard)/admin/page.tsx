"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Pencil,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminDeleteTopic,
  adminDispatchDigests,
  adminDispatchStreaks,
  adminEmailStatus,
  adminListTopics,
  adminMetrics,
  adminSendTestDigest,
  adminSendTestStreak,
  adminUpdateTopic,
  apiErrorMessage,
  type AdminMetrics,
  type AdminTopic,
} from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";
import { styleFor } from "@/lib/domain-style";

export default function AdminPage() {
  const user = useUserStore((s) => s.user);
  const router = useRouter();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [topics, setTopics] = useState<AdminTopic[] | null>(null);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Role gate — server enforces 403 anyway, but redirect sooner here.
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Load data
  useEffect(() => {
    if (!user || user.role !== "admin") return;
    let cancelled = false;
    Promise.all([adminMetrics(), adminListTopics(), adminEmailStatus()])
      .then(([m, t, s]) => {
        if (cancelled) return;
        setMetrics(m);
        setTopics(t);
        setEmailConfigured(s.configured);
      })
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Failed to load admin data")));
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;
  if (user.role !== "admin") return null;

  return (
    <main className="container px-4 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <header className="mt-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Admin only
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin panel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Topics, metrics, and notification dispatch.
        </p>
      </header>

      {error && (
        <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Metrics */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Metrics
        </h2>
        {metrics ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total users"
              value={metrics.users.total}
              hint={`+${metrics.users.newLast24h} in 24h`}
              icon={<Users className="h-4 w-4 text-primary" />}
            />
            <MetricCard
              label="DAU"
              value={metrics.users.activeLast24h}
              hint="active in last 24h"
              icon={<Sparkles className="h-4 w-4 text-emerald-400" />}
            />
            <MetricCard
              label="Topics completed"
              value={metrics.learning.topicsCompleted}
              hint={`+${metrics.learning.topicsCompletedLast24h} today`}
              icon={<ShieldCheck className="h-4 w-4 text-amber-400" />}
            />
            <MetricCard
              label="Quiz attempts"
              value={metrics.learning.quizAttempts}
              hint={`+${metrics.learning.quizAttemptsLast24h} today`}
              icon={<Sparkles className="h-4 w-4 text-rose-400" />}
            />
          </div>
        ) : (
          <SkeletonGrid />
        )}

        {metrics && metrics.popular.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
            <h3 className="text-sm font-medium">Most-completed topics</h3>
            <ul className="mt-3 space-y-2">
              {metrics.popular.map((p, i) => {
                const s = styleFor(p.domain.color);
                return (
                  <li
                    key={p.topicId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-right tabular-nums text-muted-foreground">{i + 1}</span>
                      <span className="text-foreground">{p.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-[11px] uppercase tracking-wider", s.text)}>
                        {p.domain.name}
                      </span>
                      <span className="rounded-full border border-border bg-card/60 px-2 py-0.5 text-[10px]">
                        {p.completions} completion{p.completions === 1 ? "" : "s"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Notifications */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Notifications
        </h2>
        <div className="rounded-2xl border border-border bg-card/40 p-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-cyan-400" />
              Resend status:{" "}
              {emailConfigured === null ? (
                <span className="text-muted-foreground">checking…</span>
              ) : emailConfigured ? (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
                  Configured
                </span>
              ) : (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300">
                  No API key
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Set <code>RESEND_API_KEY</code> in <code>backend/.env</code> to enable real sends.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <NotifAction
              label="Send test streak reminder to me"
              hint="Uses your account email."
              onClick={async () => {
                try {
                  const r = await adminSendTestStreak();
                  if (r.sent) toast.success(`Sent (id: ${r.id.slice(0, 8)}…)`);
                  else if (r.reason === "no_api_key") toast(`Skipped — RESEND_API_KEY not set`);
                  else toast.error(r.error ?? "Send failed");
                } catch (err) {
                  toast.error(apiErrorMessage(err));
                }
              }}
            />
            <NotifAction
              label="Send test weekly digest to me"
              hint="Uses your account email."
              onClick={async () => {
                try {
                  const r = await adminSendTestDigest();
                  if (r.sent) toast.success(`Sent (id: ${r.id.slice(0, 8)}…)`);
                  else if (r.reason === "no_api_key") toast(`Skipped — RESEND_API_KEY not set`);
                  else toast.error(r.error ?? "Send failed");
                } catch (err) {
                  toast.error(apiErrorMessage(err));
                }
              }}
            />
            <NotifAction
              label="Dispatch streak reminders (all users)"
              hint="Production: cron does this nightly."
              onClick={async () => {
                try {
                  const r = await adminDispatchStreaks();
                  toast.success(`Sent ${r.sent}/${r.attempted} (skipped ${r.skipped}, failed ${r.failed})`);
                } catch (err) {
                  toast.error(apiErrorMessage(err));
                }
              }}
            />
            <NotifAction
              label="Dispatch weekly digests (all users)"
              hint="Production: cron does this Sundays."
              onClick={async () => {
                try {
                  const r = await adminDispatchDigests();
                  toast.success(`Sent ${r.sent}/${r.attempted} (skipped ${r.skipped}, failed ${r.failed})`);
                } catch (err) {
                  toast.error(apiErrorMessage(err));
                }
              }}
            />
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Topics ({topics?.length ?? "…"})
        </h2>
        {topics ? (
          <div className="space-y-2">
            {topics.map((t) => (
              <TopicRow
                key={t.id}
                topic={t}
                onUpdated={(updated) =>
                  setTopics((prev) =>
                    prev ? prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)) : prev
                  )
                }
                onDeleted={() =>
                  setTopics((prev) => (prev ? prev.filter((x) => x.id !== t.id) : prev))
                }
              />
            ))}
          </div>
        ) : (
          <SkeletonGrid />
        )}
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card/40" />
      ))}
    </div>
  );
}

function NotifAction({
  label,
  hint,
  onClick,
}: {
  label: string;
  hint: string;
  onClick: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <div className="text-sm font-medium">{label}</div>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      <Button
        size="sm"
        variant="outline"
        className="mt-3"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onClick();
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {busy ? "Working…" : "Send"}
      </Button>
    </div>
  );
}

function TopicRow({
  topic,
  onUpdated,
  onDeleted,
}: {
  topic: AdminTopic;
  onUpdated: (t: AdminTopic) => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [summary, setSummary] = useState(topic.summary);
  const [busy, setBusy] = useState(false);
  const s = styleFor(topic.domain.color);

  async function save() {
    setBusy(true);
    try {
      const { topic: updated } = await adminUpdateTopic(topic.id, {
        title: title.trim(),
        summary: summary.trim(),
      });
      onUpdated({ ...topic, ...updated });
      setEditing(false);
      toast.success("Saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${topic.title}"? This is irreversible.`)) return;
    setBusy(true);
    try {
      await adminDeleteTopic(topic.id);
      onDeleted();
      toast.success("Deleted");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Delete failed"));
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <div>
                <Label htmlFor={`t-${topic.id}`} className="text-[11px]">
                  Title
                </Label>
                <Input
                  id={`t-${topic.id}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label htmlFor={`s-${topic.id}`} className="text-[11px]">
                  Summary
                </Label>
                <textarea
                  id={`s-${topic.id}`}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
                />
              </div>
            </div>
          ) : (
            <>
              <div className={cn("text-[11px] uppercase tracking-wider", s.text)}>
                {topic.domain.name} · {topic.phase}
              </div>
              <div className="mt-0.5 truncate text-sm font-medium text-foreground">
                {topic.title}
              </div>
              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {topic.summary}
              </div>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{topic.completedBy} completed</span>
                <span>·</span>
                <span>{topic.quizAttempts} quiz attempts</span>
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={save} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={remove}
                aria-label="Delete"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={busy}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
