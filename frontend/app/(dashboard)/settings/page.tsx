"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Flame,
  Loader2,
  LogOut,
  Mail,
  Snowflake,
  Sparkles,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  apiErrorMessage,
  fetchDomains,
  fetchMe,
  fetchStreak,
  logoutUser,
  spendStreakFreeze,
  updateProfile,
  updateSettings,
  type Domain,
  type Streak,
  type UserProfile,
} from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";
import { styleFor } from "@/lib/domain-style";

const PRIOR_LEVELS: Array<{ value: UserProfile["priorLevel"]; label: string; hint: string }> = [
  { value: "none", label: "Brand new", hint: "Just getting into tech" },
  { value: "some", label: "Some experience", hint: "I know some basics" },
  { value: "experienced", label: "Experienced", hint: "Years in the field" },
];

const GOALS: Array<{ value: UserProfile["goal"]; label: string; hint: string }> = [
  { value: "interview", label: "Crack interviews", hint: "Job-prep focused" },
  { value: "awareness", label: "Build awareness", hint: "Stay current with tech" },
  { value: "curiosity", label: "Pure curiosity", hint: "Learn for the love of it" },
];

const PACES: Array<{ value: UserProfile["pace"]; label: string; hint: string }> = [
  { value: "relaxed", label: "Relaxed", hint: "A few topics a week" },
  { value: "standard", label: "Standard", hint: "Daily topic + quiz" },
  { value: "intense", label: "Intense", hint: "Multiple topics per day" },
];

export default function SettingsPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const setMe = useUserStore((s) => s.setMe);
  const clear = useUserStore((s) => s.clear);

  // Notification settings
  const [reminderTime, setReminderTime] = useState<string>("");
  const [digestEnabled, setDigestEnabled] = useState<boolean>(true);
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Learning preferences
  const [priorLevel, setPriorLevel] = useState<UserProfile["priorLevel"]>("none");
  const [goal, setGoal] = useState<UserProfile["goal"]>("interview");
  const [pace, setPace] = useState<UserProfile["pace"]>("standard");
  const [preferredDomains, setPreferredDomains] = useState<string[]>([]);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Streak + domains data
  const [streak, setStreak] = useState<Streak | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [usingFreeze, setUsingFreeze] = useState(false);

  // Bootstrap from store + fetch live data
  useEffect(() => {
    if (!user?.profile) return;
    setReminderTime(user.profile.reminderTime ?? "");
    setDigestEnabled(user.profile.digestEnabled ?? true);
    setPriorLevel(user.profile.priorLevel);
    setGoal(user.profile.goal);
    setPace(user.profile.pace);
    setPreferredDomains(user.profile.preferredDomains ?? []);
  }, [user?.profile]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchStreak(), fetchDomains()])
      .then(([s, d]) => {
        if (cancelled) return;
        setStreak(s);
        setDomains(d);
      })
      .catch(() => {
        /* non-fatal — banners will show "—" */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user || !user.profile) {
    return (
      <main className="container flex items-center justify-center px-4 py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </main>
    );
  }

  async function handleSaveNotifs() {
    setSavingNotifs(true);
    try {
      await updateSettings({
        reminderTime: reminderTime.trim() || null,
        digestEnabled,
      });
      const me = await fetchMe();
      setMe(me);
      toast.success("Notifications saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save"));
    } finally {
      setSavingNotifs(false);
    }
  }

  async function handleSavePrefs() {
    setSavingPrefs(true);
    try {
      await updateProfile({
        priorLevel,
        goal,
        pace,
        preferredDomains,
      });
      const me = await fetchMe();
      setMe(me);
      toast.success("Learning preferences saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save"));
    } finally {
      setSavingPrefs(false);
    }
  }

  async function handleUseFreeze() {
    if (!streak || streak.freezesAvailable <= 0) return;
    setUsingFreeze(true);
    try {
      const { remaining } = await spendStreakFreeze();
      setStreak({ ...streak, freezesAvailable: remaining });
      toast.success("❄️ Freeze banked — your streak is safer");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not use freeze"));
    } finally {
      setUsingFreeze(false);
    }
  }

  async function handleSignOut() {
    await logoutUser();
    clear();
    toast.success("Signed out");
    router.replace("/");
  }

  return (
    <main className="container max-w-3xl px-4 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <header className="mt-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Account
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Profile, preferences, notifications, and account actions.
        </p>
      </header>

      <section className="mt-8 space-y-6">
        {/* ── Account info (read-only) ─────────────────────── */}
        <SettingCard
          icon={<User className="h-4 w-4 text-primary" />}
          title="Account"
          hint="Your profile snapshot."
        >
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={user.name} />
            <Field label="Email" value={user.email} />
            <Field
              label="Role"
              value={
                user.role === "admin" ? (
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                    Admin
                  </span>
                ) : (
                  "User"
                )
              }
            />
            <Field
              label="Member since"
              value={new Date(user.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
            <Field
              label="Level"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  Lvl {user.level}
                </span>
              }
            />
            <Field
              label="Total XP"
              value={<span className="tabular-nums">{user.xp.toLocaleString()}</span>}
            />
          </dl>
        </SettingCard>

        {/* ── Streak rescue ─────────────────────────────────── */}
        <SettingCard
          icon={<Flame className="h-4 w-4 text-orange-400" />}
          title="Streak"
          hint="Use a freeze proactively to protect tomorrow's day."
        >
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums tracking-tight">
                  {streak?.currentStreak ?? "—"}
                </span>
                <span className="text-sm text-muted-foreground">
                  day{(streak?.currentStreak ?? 0) === 1 ? "" : "s"} current
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Longest streak: {streak?.longestStreak ?? "—"}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: streak?.freezesAvailable ?? 0 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                  >
                    <Snowflake className="h-3.5 w-3.5" />
                  </div>
                ))}
                {(streak?.freezesAvailable ?? 0) === 0 && (
                  <span className="text-xs text-muted-foreground">No freezes — refill on Monday</span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUseFreeze}
                disabled={usingFreeze || !streak || streak.freezesAvailable <= 0}
              >
                {usingFreeze && <Loader2 className="h-4 w-4 animate-spin" />}
                <Snowflake className="h-4 w-4" />
                Use a freeze
              </Button>
            </div>
          </div>
        </SettingCard>

        {/* ── Learning preferences ──────────────────────────── */}
        <SettingCard
          icon={<Target className="h-4 w-4 text-violet-400" />}
          title="Learning preferences"
          hint="Adjust what the AI tutor knows about your level and goals."
        >
          <div className="mt-5 space-y-5">
            <RadioGroup
              label="Prior level"
              options={PRIOR_LEVELS}
              value={priorLevel}
              onChange={setPriorLevel}
            />
            <RadioGroup label="Goal" options={GOALS} value={goal} onChange={setGoal} />
            <RadioGroup label="Pace" options={PACES} value={pace} onChange={setPace} />

            {domains.length > 0 && (
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Preferred domains
                </Label>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Used by the recommender to prioritise your next topic.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {domains.map((d) => {
                    const s = styleFor(d.color);
                    const active = preferredDomains.includes(d.slug);
                    return (
                      <button
                        key={d.slug}
                        type="button"
                        onClick={() =>
                          setPreferredDomains((prev) =>
                            active ? prev.filter((x) => x !== d.slug) : [...prev, d.slug]
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition",
                          active
                            ? `${s.badgeBg} border-transparent`
                            : "border-border bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSavePrefs} disabled={savingPrefs}>
              {savingPrefs && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingPrefs ? "Saving…" : "Save preferences"}
            </Button>
          </div>
        </SettingCard>

        {/* ── Notifications (existing) ──────────────────────── */}
        <SettingCard
          icon={<Bell className="h-4 w-4 text-orange-400" />}
          title="Notifications"
          hint="Email reminders and weekly summary."
        >
          <div className="mt-5 space-y-5">
            <div className="max-w-xs">
              <Label htmlFor="reminderTime">Daily reminder time (UTC)</Label>
              <Input
                id="reminderTime"
                type="time"
                className="mt-1.5"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {reminderTime
                  ? `Reminder set for ${reminderTime} UTC if your streak is at risk.`
                  : "Leave blank to opt out of streak reminders."}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-card/40 p-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  Weekly digest
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sunday email summarising your week.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={digestEnabled}
                onClick={() => setDigestEnabled((v) => !v)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
                  digestEnabled ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
                    digestEnabled ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveNotifs} disabled={savingNotifs}>
              {savingNotifs && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingNotifs ? "Saving…" : "Save notifications"}
            </Button>
          </div>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Email actually sends only if the backend has{" "}
            <code className="rounded bg-card px-1 py-0.5 text-[10px]">RESEND_API_KEY</code>{" "}
            set. Otherwise preferences are saved but emails are stubbed.
          </p>
        </SettingCard>

        {/* ── Danger zone ───────────────────────────────────── */}
        <SettingCard
          icon={<LogOut className="h-4 w-4 text-rose-400" />}
          title="Account actions"
          hint="Sign out of this browser."
        >
          <div className="mt-4 flex justify-end">
            <Button variant="destructive" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </SettingCard>
      </section>
    </main>
  );
}

function SettingCard({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string; hint: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                active
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-card/40 hover:border-primary/40"
              )}
            >
              <div className="text-sm font-medium text-foreground">{opt.label}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{opt.hint}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
