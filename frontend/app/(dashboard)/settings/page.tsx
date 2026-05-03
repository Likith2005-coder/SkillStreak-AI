"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Loader2, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage, fetchMe, updateSettings } from "@/lib/api";
import { useUserStore } from "@/store/userStore";

export default function SettingsPage() {
  const user = useUserStore((s) => s.user);
  const setMe = useUserStore((s) => s.setMe);

  const [reminderTime, setReminderTime] = useState<string>("");
  const [digestEnabled, setDigestEnabled] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  // Pull initial values from the store profile.
  useEffect(() => {
    if (!user?.profile) return;
    setReminderTime(user.profile.reminderTime ?? "");
    setDigestEnabled(user.profile.digestEnabled ?? true);
  }, [user?.profile]);

  if (!user || !user.profile) {
    return (
      <main className="container flex items-center justify-center px-4 py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </main>
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings({
        reminderTime: reminderTime.trim() || null,
        digestEnabled,
      });
      // Refresh /me so the store has the latest profile.
      const me = await fetchMe();
      setMe(me);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save settings"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="container max-w-2xl px-4 py-10">
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
          Notification preferences and reminders.
        </p>
      </header>

      <section className="mt-8 space-y-6">
        {/* Daily streak reminder */}
        <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-orange-400" />
            Daily streak reminder
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Get an email at this time (UTC) if your streak is at risk. Leave
            blank to opt out.
          </p>

          <div className="mt-5 max-w-xs">
            <Label htmlFor="reminderTime">Time (24h, UTC)</Label>
            <Input
              id="reminderTime"
              type="time"
              className="mt-1.5"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              placeholder="e.g. 20:00"
            />
            {reminderTime && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Reminder set for <strong className="text-foreground">{reminderTime}</strong> UTC.
              </p>
            )}
          </div>
        </div>

        {/* Weekly digest */}
        <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-cyan-400" />
                Weekly digest
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Sunday email with your XP, completed topics, and leaderboard rank.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={digestEnabled}
              onClick={() => setDigestEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                digestEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  digestEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Email actually sends only if the backend has{" "}
          <code className="rounded bg-card px-1 py-0.5 text-[10px]">RESEND_API_KEY</code>{" "}
          configured. Until then your preferences are saved but emails are
          stubbed (logged server-side).
        </p>
      </section>
    </main>
  );
}
