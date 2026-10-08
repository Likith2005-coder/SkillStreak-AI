"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "next-view-transitions";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Check,
  Flame,
  Gem,
  Loader2,
  LogOut,
  Mail,
  Snowflake,
  Star,
  Target,
  User,
  type LucideIcon,
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
        <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
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
    <main className="container max-w-3xl px-4 py-8">
      <Link
        href="/dashboard"
        className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

      <header className="relative mt-3">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-16 h-48 w-80 rounded-full bg-aurora-2/[0.12] blur-3xl"
        />
        <h1 className="relative font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.02] text-foreground">
          <span className="font-serif-accent text-primary">Your</span> settings
        </h1>
        <p className="relative mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">
          Profile, preferences, notifications, and account actions.
        </p>
      </header>

      <section className="mt-10 space-y-5">
        {/* ── Account info (read-only) ─────────────────────── */}
        <SettingCard
          icon={User}
          tone="bg-secondary/10 text-secondary ring-secondary/20"
          spot="var(--secondary)"
          title="Account"
          hint="Your profile snapshot."
        >
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-3">
            <Field label="Name" value={user.name} />
            <Field
              label="Role"
              value={
                user.role === "admin" ? (
                  <span className="rounded-full border border-grape/25 bg-grape/10 px-2.5 py-0.5 text-xs font-medium text-grape">
                    Admin
                  </span>
                ) : (
                  "User"
                )
              }
            />
            <Field
              label="Email"
              className="col-span-2 sm:col-span-1"
              value={<span className="break-all">{user.email}</span>}
            />
            <Field
              label="Level"
              value={
                <span className="inline-flex items-center gap-1.5 text-grape">
                  <Star className="h-4 w-4" aria-hidden />
                  Level {user.level}
                </span>
              }
            />
            <Field
              label="Total XP"
              value={
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-xp">
                  <Gem className="h-4 w-4" aria-hidden />
                  {user.xp.toLocaleString()}
                </span>
              }
            />
            <Field
              label="Member since"
              className="col-span-2 sm:col-span-1"
              value={new Date(user.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
          </dl>
        </SettingCard>

        {/* ── Streak rescue ─────────────────────────────────── */}
        <SettingCard
          icon={Flame}
          tone="bg-energy/10 text-energy ring-energy/20"
          spot="var(--energy)"
          title="Streak"
          hint="Use a freeze proactively to protect tomorrow's day."
        >
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-6xl leading-none tabular-nums text-energy [text-shadow:0_0_28px_hsl(var(--energy)/0.5)]">
                  {streak?.currentStreak ?? "—"}
                </span>
                <span className="text-[15px] text-muted-foreground">
                  day{(streak?.currentStreak ?? 0) === 1 ? "" : "s"} current
                </span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Longest streak:{" "}
                <span className="font-mono font-semibold tabular-nums text-foreground">{streak?.longestStreak ?? "—"}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                {Array.from({ length: streak?.freezesAvailable ?? 0 }).map((_, i) => (
                  <span
                    key={i}
                    title="Streak freeze"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary shadow-[0_0_18px_-4px_hsl(var(--secondary)/0.6)] ring-1 ring-secondary/30"
                  >
                    <Snowflake className="h-5 w-5" aria-hidden />
                    <span className="sr-only">Streak freeze available</span>
                  </span>
                ))}
                {(streak?.freezesAvailable ?? 0) === 0 && (
                  <span className="text-sm text-muted-foreground">No freezes. They refill on Monday.</span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleUseFreeze}
                disabled={usingFreeze || !streak || streak.freezesAvailable <= 0}
              >
                {usingFreeze ? (
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                ) : (
                  <Snowflake className="h-4 w-4 text-secondary" />
                )}
                Use a freeze
              </Button>
            </div>
          </div>
        </SettingCard>

        {/* ── Learning preferences ──────────────────────────── */}
        <SettingCard
          icon={Target}
          tone="bg-grape/10 text-grape ring-grape/20"
          spot="var(--grape)"
          title="Learning preferences"
          hint="Adjust what the AI tutor knows about your level and goals."
          footer={
            <Button onClick={handleSavePrefs} disabled={savingPrefs} className="w-full sm:w-auto">
              {savingPrefs && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
              {savingPrefs ? "Saving…" : "Save preferences"}
            </Button>
          }
        >
          <div className="divide-y divide-white/[0.06]">
            <Row>
              <RadioGroup
                label="Prior level"
                options={PRIOR_LEVELS}
                value={priorLevel}
                onChange={setPriorLevel}
              />
            </Row>
            <Row>
              <RadioGroup label="Goal" options={GOALS} value={goal} onChange={setGoal} />
            </Row>
            <Row>
              <RadioGroup label="Pace" options={PACES} value={pace} onChange={setPace} />
            </Row>

            {domains.length > 0 && (
              <Row>
                <fieldset>
                  <legend className="text-sm font-semibold text-foreground">Preferred domains</legend>
                  <p className="mt-1 text-sm text-muted-foreground">
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
                          aria-pressed={active}
                          onClick={() =>
                            setPreferredDomains((prev) =>
                              active ? prev.filter((x) => x !== d.slug) : [...prev, d.slug]
                            )
                          }
                          className={cn(
                            "focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors motion-reduce:transition-none",
                            active
                              ? s.badgeBg
                              : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground"
                          )}
                        >
                          {active && <Check className="h-4 w-4" aria-hidden />}
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </Row>
            )}
          </div>
        </SettingCard>

        {/* ── Notifications ─────────────────────────────────── */}
        <SettingCard
          icon={Bell}
          tone="bg-xp/10 text-xp ring-xp/20"
          spot="var(--xp)"
          title="Notifications"
          hint="Email reminders and weekly summary."
          footer={
            <Button onClick={handleSaveNotifs} disabled={savingNotifs} className="w-full sm:w-auto">
              {savingNotifs && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
              {savingNotifs ? "Saving…" : "Save notifications"}
            </Button>
          }
        >
          <div className="divide-y divide-white/[0.06]">
            <Row className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <Label htmlFor="reminderTime" className="text-sm font-semibold">
                  Daily reminder time (UTC)
                </Label>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {reminderTime
                    ? `Reminder set for ${reminderTime} UTC if your streak is at risk.`
                    : "Leave blank to opt out of streak reminders."}
                </p>
              </div>
              <Input
                id="reminderTime"
                type="time"
                className="w-full font-mono tabular-nums [color-scheme:dark] sm:w-40"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </Row>

            <Row className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div id="digest-label" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Mail className="h-4 w-4 text-secondary" aria-hidden />
                  Weekly digest
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sunday email summarising your week.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={digestEnabled}
                aria-labelledby="digest-label"
                onClick={() => setDigestEnabled((v) => !v)}
                className="focus-ring group relative inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-full"
              >
                <span
                  aria-hidden
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full border transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none",
                    digestEnabled
                      ? "border-primary/80 bg-primary shadow-[0_0_16px_-2px_hsl(var(--primary)/0.7)]"
                      : "border-white/15 bg-white/[0.08] group-hover:border-white/25"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-[18px] w-[18px] rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.5)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                      digestEnabled ? "translate-x-[22px] bg-primary-foreground" : "translate-x-[2px] bg-foreground/80"
                    )}
                  />
                </span>
              </button>
            </Row>

            <Row>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Email actually sends only if the backend has{" "}
                <code className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-xs text-foreground">
                  RESEND_API_KEY
                </code>{" "}
                set. Otherwise preferences are saved but emails are stubbed.
              </p>
            </Row>
          </div>
        </SettingCard>

        {/* ── Danger zone ───────────────────────────────────── */}
        <SettingCard
          icon={LogOut}
          tone="bg-destructive/10 text-destructive-text ring-destructive/25"
          spot="var(--destructive)"
          title="Account actions"
          hint="Sign out of this browser."
          aside={
            <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          }
        />
      </section>
    </main>
  );
}

/** A settings panel: header row, hairline-divided body, optional footer bar. */
function SettingCard({
  icon: Icon,
  tone,
  spot,
  title,
  hint,
  aside,
  footer,
  children,
}: {
  icon: LucideIcon;
  /** Role-tinted icon well classes. */
  tone: string;
  /** Spotlight colour channels. */
  spot: string;
  title: string;
  hint: string;
  /** Inline action on the header row (used when the panel has no body). */
  aside?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="card-chunky spotlight overflow-hidden" style={{ "--spot": spot } as CSSProperties}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3.5">
          <span aria-hidden className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1", tone)}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl text-foreground">{title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
          </div>
        </div>
        {aside}
      </div>
      {children && <div className="border-t border-white/[0.06] px-5 py-5 sm:px-6">{children}</div>}
      {footer && (
        <div className="flex justify-end border-t border-white/[0.06] bg-white/[0.02] px-5 py-4 sm:px-6">{footer}</div>
      )}
    </div>
  );
}

/** One hairline-separated row inside a settings panel. */
function Row({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("py-5 first:pt-0 last:pb-0", className)}>{children}</div>;
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 bg-card px-4 py-3.5", className)}>
      <dt className="label-mono text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 text-[15px] font-medium text-foreground">{value}</dd>
    </div>
  );
}

/** A segmented control: one track, the chosen segment lit in selection blue. */
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
    <fieldset>
      <legend className="text-sm font-semibold text-foreground">{label}</legend>
      <div className="mt-3 grid gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1 shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)] sm:grid-cols-3">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "focus-ring min-h-[44px] rounded-lg px-3.5 py-2.5 text-left transition-[background-color,box-shadow,color] duration-200 motion-reduce:transition-none",
                active
                  ? "bg-secondary/[0.12] shadow-[inset_0_0_0_1px_hsl(var(--secondary)/0.5),0_0_20px_-8px_hsl(var(--secondary)/0.7)]"
                  : "hover:bg-white/[0.04]"
              )}
            >
              <div className={cn("text-sm font-semibold", active ? "text-secondary" : "text-foreground")}>{opt.label}</div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">{opt.hint}</div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
