/**
 * Phase 8 — Notification jobs.
 *
 * Two notification flows:
 *   1. Streak reminder  — daily at the user's chosen reminder_time, if their
 *                         streak is at risk (no activity yet today).
 *   2. Weekly digest    — every Sunday, summarising the week (XP earned,
 *                         topics completed, leaderboard rank).
 *
 * Each function below sends to ONE user. Bulk dispatchers iterate. The
 * actual scheduling (cron) lives in Phase 11 (production deployment); for
 * now the admin can fire them manually via the admin UI to demo the flow.
 */

import { prisma } from "../config/db";
import { ApiError } from "../middleware/error.middleware";
import { sendEmail, isEmailConfigured, type SendResult } from "./email.service";
import { log } from "../utils/logger.util";

// ─── Helpers ────────────────────────────────────────────────

function utcDateOnly(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function startOfIsoWeekUtc(d: Date): Date {
  const x = utcDateOnly(d);
  const dow = x.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  x.setUTCDate(x.getUTCDate() + offset);
  return x;
}

function htmlShell(inner: string): string {
  // Minimal email-safe HTML. Inline styles only — many clients strip <style>.
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0b0d18;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#e5e7eb;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="font-size:18px;font-weight:700;letter-spacing:-0.01em;">
      <span style="background:linear-gradient(90deg,#6366f1,#a855f7,#d946ef);-webkit-background-clip:text;background-clip:text;color:transparent;">SkillStreak</span>
      <span style="color:#fff;"> AI</span>
    </div>
    <div style="margin-top:24px;background:#11142a;border:1px solid #2a2d3f;border-radius:14px;padding:24px;">
      ${inner}
    </div>
    <p style="margin-top:24px;font-size:11px;color:#8b8fa8;text-align:center;">
      You're receiving this because you signed up for SkillStreak AI. Manage
      preferences in your <a href="#" style="color:#a78bfa;">Settings</a>.
    </p>
  </div>
</body></html>`;
}

// ─── Streak reminder ────────────────────────────────────────

export async function sendStreakReminder(userId: string): Promise<SendResult> {
  const [user, streak] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    }),
    prisma.streak.findUnique({ where: { userId } }),
  ]);
  if (!user) throw new ApiError(404, "User not found");

  const today = utcDateOnly(new Date());
  const lastActive = streak?.lastActiveDate ? utcDateOnly(streak.lastActiveDate) : null;
  const alreadyActiveToday = lastActive && lastActive.getTime() === today.getTime();
  const days = streak?.currentStreak ?? 0;
  const freezes = streak?.freezesAvailable ?? 0;

  const inner = alreadyActiveToday
    ? `<h2 style="margin:0 0 12px;font-size:20px;color:#fff;">Nice work today, ${user.name.split(" ")[0]}!</h2>
       <p style="margin:0;color:#cbd5e1;line-height:1.6;">
         You've already kept your <strong style="color:#fb923c;">${days}-day streak</strong> alive. See you tomorrow.
       </p>`
    : `<h2 style="margin:0 0 12px;font-size:20px;color:#fff;">🔥 Don't break your streak.</h2>
       <p style="margin:0 0 16px;color:#cbd5e1;line-height:1.6;">
         Hi ${user.name.split(" ")[0]} — your <strong style="color:#fb923c;">${days}-day streak</strong> is at risk.
         Complete one topic or take one quiz before midnight to keep it alive.
       </p>
       ${freezes > 0
         ? `<p style="margin:0 0 16px;color:#7dd3fc;font-size:13px;">
              ❄️ You have ${freezes} freeze${freezes === 1 ? "" : "s"} banked — they auto-spend if you miss a day.
            </p>`
         : ""}
       <a href="http://localhost:3000/dashboard"
          style="display:inline-block;padding:12px 20px;border-radius:999px;background:linear-gradient(90deg,#6366f1,#a855f7);color:#fff;text-decoration:none;font-weight:600;font-size:14px;">
         Open SkillStreak →
       </a>`;

  return sendEmail({
    to: user.email,
    subject: alreadyActiveToday
      ? `Day ${days} secured — keep going`
      : `🔥 Your ${days}-day streak is at risk`,
    html: htmlShell(inner),
  });
}

// ─── Weekly digest ──────────────────────────────────────────

export async function sendWeeklyDigest(userId: string): Promise<SendResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, level: true, xp: true },
  });
  if (!user) throw new ApiError(404, "User not found");

  const weekStart = startOfIsoWeekUtc(new Date());

  const [xpThisWeek, topicsCompleted, attemptsThisWeek, streak] = await Promise.all([
    prisma.xpEvent.aggregate({
      where: { userId, createdAt: { gte: weekStart } },
      _sum: { amount: true },
    }),
    prisma.userProgress.count({
      where: { userId, status: "completed", completedAt: { gte: weekStart } },
    }),
    prisma.quizAttempt.count({
      where: { userId, attemptedAt: { gte: weekStart } },
    }),
    prisma.streak.findUnique({ where: { userId } }),
  ]);

  const totalXp = xpThisWeek._sum.amount ?? 0;

  const inner = `
    <h2 style="margin:0 0 12px;font-size:20px;color:#fff;">Your week in review</h2>
    <p style="margin:0 0 20px;color:#cbd5e1;line-height:1.6;">
      Hi ${user.name.split(" ")[0]} — here's what you got done this week.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px;">
      <tr>
        ${digestStatCell("XP", String(totalXp), "#a78bfa")}
        ${digestStatCell("Topics", String(topicsCompleted), "#34d399")}
      </tr>
      <tr>
        ${digestStatCell("Quizzes", String(attemptsThisWeek), "#fbbf24")}
        ${digestStatCell("Streak", `${streak?.currentStreak ?? 0}d`, "#fb923c")}
      </tr>
    </table>

    <p style="margin:24px 0 16px;color:#cbd5e1;line-height:1.6;">
      You're at <strong style="color:#fff;">Level ${user.level}</strong> with
      <strong style="color:#fff;">${user.xp.toLocaleString()} XP</strong> total.
    </p>

    <a href="http://localhost:3000/progress"
       style="display:inline-block;padding:12px 20px;border-radius:999px;background:linear-gradient(90deg,#6366f1,#a855f7);color:#fff;text-decoration:none;font-weight:600;font-size:14px;">
      View full analytics →
    </a>
  `;

  return sendEmail({
    to: user.email,
    subject: `Your SkillStreak week — ${totalXp} XP, ${topicsCompleted} topic${topicsCompleted === 1 ? "" : "s"}`,
    html: htmlShell(inner),
  });
}

function digestStatCell(label: string, value: string, color: string): string {
  return `<td width="50%" style="padding:0;">
    <div style="background:#181c33;border:1px solid #2a2d3f;border-radius:10px;padding:16px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:${color};">${label}</div>
      <div style="margin-top:6px;font-size:24px;font-weight:700;color:#fff;">${value}</div>
    </div>
  </td>`;
}

// ─── Bulk dispatchers (admin-triggered) ─────────────────────

export async function dispatchStreakReminders(): Promise<{
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  if (!isEmailConfigured()) {
    log.warn("dispatchStreakReminders called without email configured — no-op");
    return { attempted: 0, sent: 0, skipped: 0, failed: 0 };
  }
  const recipients = await prisma.user.findMany({
    where: {
      profile: { reminderTime: { not: null } },
      streak: { currentStreak: { gt: 0 } },
    },
    select: { id: true },
  });

  let sent = 0,
    skipped = 0,
    failed = 0;
  for (const r of recipients) {
    try {
      const result = await sendStreakReminder(r.id);
      if (result.sent) sent++;
      else if (result.reason === "no_api_key") skipped++;
      else failed++;
    } catch {
      failed++;
    }
  }
  return { attempted: recipients.length, sent, skipped, failed };
}

export async function dispatchWeeklyDigests(): Promise<{
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
}> {
  if (!isEmailConfigured()) {
    log.warn("dispatchWeeklyDigests called without email configured — no-op");
    return { attempted: 0, sent: 0, skipped: 0, failed: 0 };
  }
  const recipients = await prisma.user.findMany({
    where: { profile: { digestEnabled: true } },
    select: { id: true },
  });

  let sent = 0,
    skipped = 0,
    failed = 0;
  for (const r of recipients) {
    try {
      const result = await sendWeeklyDigest(r.id);
      if (result.sent) sent++;
      else if (result.reason === "no_api_key") skipped++;
      else failed++;
    } catch {
      failed++;
    }
  }
  return { attempted: recipients.length, sent, skipped, failed };
}
