"use client";

import { useEffect, useState } from "react";
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
        className="focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-lg text-sm font-extrabold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={3} />
        Back to dashboard
      </Link>

      <header className="mt-2">
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">Settings</h1>
        <p className="mt-1 text-base font-semibold text-muted-foreground">
          Profile, preferences, notifications, and account actions.
        </p>
      </header>

      <section className="mt-8 space-y-6">
        {/* ── Account info (read-only) ─────────────────────── */}
        <SettingCard
          icon={User}
          face="bg-secondary-bright"
          edge="hsl(var(--secondary-shade))"
          title="Account"
          hint="Your profile snapshot."
        >
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Name" value={user.name} />
            <Field
              label="Role"
              value={
                user.role === "admin" ? (
                  <span className="rounded-full bg-grape/10 px-2.5 py-0.5 text-xs font-extrabold text-grape">
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
                  <Star className="h-4 w-4" fill="currentColor" aria-hidden />
                  Level {user.level}
                </span>
              }
            />
            <Field
              label="Total XP"
              value={
                <span className="inline-flex items-center gap-1.5 tabular-nums text-xp">
                  <Gem className="h-4 w-4" fill="currentColor" aria-hidden />
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
          face="bg-energy-bright"
          edge="hsl(var(--energy-shade))"
          title="Streak"
          hint="Use a freeze proactively to protect tomorrow's day."
        >
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl tabular-nums text-energy">
                  {streak?.currentStreak ?? "—"}
                </span>
                <span className="text-base font-extrabold text-muted-foreground">
                  day{(streak?.currentStreak ?? 0) === 1 ? "" : "s"} current
                </span>
              </div>
              <div className="mt-1 text-sm font-bold text-muted-foreground">
                Longest streak: {streak?.longestStreak ?? "—"}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                {Array.from({ length: streak?.freezesAvailable ?? 0 }).map((_, i) => (
                  <span
                    key={i}
                    title="Streak freeze"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-bright text-white"
                    style={{ boxShadow: "0 4px 0 hsl(var(--secondary-shade))" }}
                  >
                    <Snowflake className="h-5 w-5" strokeWidth={2.6} aria-hidden />
                    <span className="sr-only">Streak freeze available</span>
                  </span>
                ))}
                {(streak?.freezesAvailable ?? 0) === 0 && (
                  <span className="text-sm font-bold text-muted-foreground">No freezes. They refill on Monday.</span>
                )}
              </div>
              <Button
                variant="secondary"
                onClick={handleUseFreeze}
                disabled={usingFreeze || !streak || streak.freezesAvailable <= 0}
              >
                {usingFreeze ? (
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                ) : (
                  <Snowflake className="h-4 w-4" strokeWidth={2.6} />
                )}
                Use a freeze
              </Button>
            </div>
          </div>
        </SettingCard>

        {/* ── Learning preferences ──────────────────────────── */}
        <SettingCard
          icon={Target}
          face="bg-grape-bright"
          edge="hsl(var(--grape-shade))"
          title="Learning preferences"
          hint="Adjust what the AI tutor knows about your level and goals."
        >
          <div className="mt-6 space-y-6">
            <RadioGroup
              label="Prior level"
              options={PRIOR_LEVELS}
              value={priorLevel}
              onChange={setPriorLevel}
            />
            <RadioGroup label="Goal" options={GOALS} value={goal} onChange={setGoal} />
            <RadioGroup label="Pace" options={PACES} value={pace} onChange={setPace} />

            {domains.length > 0 && (
              <fieldset>
                <legend className="text-base font-black text-foreground">Preferred domains</legend>
                <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
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
                          "focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl border-2 border-b-4 px-4 py-2 text-sm font-extrabold transition-[transform,border-width,background-color] duration-100 active:translate-y-[2px] active:border-b-2 motion-reduce:transition-none",
                          active
                            ? cn(s.badgeBg)
                            : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {active && <Check className="h-4 w-4" strokeWidth={3.5} aria-hidden />}
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </div>

          <div className="mt-7 flex justify-end">
            <Button onClick={handleSavePrefs} disabled={savingPrefs} className="w-full uppercase sm:w-auto">
              {savingPrefs && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
              {savingPrefs ? "Saving…" : "Save preferences"}
            </Button>
          </div>
        </SettingCard>

        {/* ── Notifications (existing) ──────────────────────── */}
        <SettingCard
          icon={Bell}
          face="bg-xp-bright"
          edge="hsl(var(--xp-shade))"
          title="Notifications"
          hint="Email reminders and weekly summary."
        >
          <div className="mt-6 space-y-5">
            <div className="max-w-xs">
              <Label htmlFor="reminderTime" className="text-base font-black text-foreground">
                Daily reminder time (UTC)
              </Label>
              <Input
                id="reminderTime"
                type="time"
                className="mt-2 h-12 rounded-2xl border-2 border-b-4 border-border bg-card px-4 text-base font-bold focus-visible:border-secondary-bright focus-visible:ring-0 focus-visible:ring-offset-0"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                {reminderTime
                  ? `Reminder set for ${reminderTime} UTC if your streak is at risk.`
                  : "Leave blank to opt out of streak reminders."}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-border p-4">
              <div>
                <div id="digest-label" className="flex items-center gap-2 text-base font-black text-foreground">
                  <Mail className="h-5 w-5 text-secondary" strokeWidth={2.6} aria-hidden />
                  Weekly digest
                </div>
                <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
                  Sunday email summarising your week.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={digestEnabled}
                aria-labelledby="digest-label"
                onClick={() => setDigestEnabled((v) => !v)}
                className={cn(
                  "focus-ring relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border-2 transition-colors motion-reduce:transition-none",
                  digestEnabled ? "border-primary-shade bg-primary-bright" : "border-border bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-7 w-7 rounded-full bg-white transition-transform motion-reduce:transition-none",
                    digestEnabled ? "translate-x-[1.85rem]" : "translate-x-0.5"
                  )}
                  style={{ boxShadow: "0 2px 0 hsl(var(--border))" }}
                />
              </button>
            </div>
          </div>

          <div className="mt-7 flex justify-end">
            <Button onClick={handleSaveNotifs} disabled={savingNotifs} className="w-full uppercase sm:w-auto">
              {savingNotifs && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
              {savingNotifs ? "Saving…" : "Save notifications"}
            </Button>
          </div>

          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            Email actually sends only if the backend has{" "}
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">RESEND_API_KEY</code>{" "}
            set. Otherwise preferences are saved but emails are stubbed.
          </p>
        </SettingCard>

        {/* ── Danger zone ───────────────────────────────────── */}
        <SettingCard
          icon={LogOut}
          face="bg-destructive-bright"
          edge="hsl(var(--destructive-shade))"
          title="Account actions"
          hint="Sign out of this browser."
        >
          <div className="mt-5 flex justify-end">
            <Button variant="destructive" onClick={handleSignOut} className="w-full uppercase sm:w-auto">
              <LogOut className="h-4 w-4" strokeWidth={2.6} />
              Sign out
            </Button>
          </div>
        </SettingCard>
      </section>
    </main>
  );
}

function SettingCard({
  icon: Icon,
  face,
  edge,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  face: string;
  edge: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-chunky p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn("flex h-11 w-11 shrink-0 -rotate-6 items-center justify-center rounded-2xl", face)}
          style={{ boxShadow: `0 4px 0 ${edge}` }}
        >
          <Icon className="h-6 w-6 text-white" strokeWidth={2.6} />
        </span>
        <div>
          <h2 className="text-xl font-black text-foreground">{title}</h2>
          <p className="text-sm font-semibold text-muted-foreground">{hint}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 rounded-2xl bg-muted px-4 py-3", className)}>
      <dt className="text-xs font-extrabold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-base font-black text-foreground">{value}</dd>
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
    <fieldset>
      <legend className="text-base font-black text-foreground">{label}</legend>
      <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "focus-ring rounded-2xl border-2 border-b-4 p-3.5 text-left transition-[transform,border-width,background-color] duration-100 active:translate-y-[2px] active:border-b-2 motion-reduce:transition-none",
                active
                  ? "border-secondary-bright bg-secondary/10"
                  : "border-border bg-card hover:bg-muted"
              )}
            >
              <div className={cn("text-base font-black", active ? "text-secondary-shade" : "text-foreground")}>{opt.label}</div>
              <div className="mt-0.5 text-sm font-semibold text-muted-foreground">{opt.hint}</div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
