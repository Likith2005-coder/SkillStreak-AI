import { toast } from "sonner";
import type { GamificationDelta } from "@/lib/api";

const REASON_LABEL: Record<string, string> = {
  topic_complete: "Topic complete",
  first_topic_of_day: "First topic of the day",
  quiz_pass: "Quiz passed",
  quiz_perfect: "Perfect quiz",
  streak_day: "Streak +1",
  comeback: "Welcome back!",
};

export function surfaceGamification(delta: GamificationDelta | null) {
  if (!delta) return;

  if (delta.xp.totalAwarded > 0) {
    const reasons = delta.xp.events.map((e) => REASON_LABEL[e.reason] ?? e.reason).join(" · ");
    toast.success(`+${delta.xp.totalAwarded} XP`, {
      description: reasons,
      duration: 4000,
    });
  }

  if (delta.xp.newLevel > delta.xp.oldLevel) {
    toast.success(`Level up! → Lvl ${delta.xp.newLevel}`, {
      description: "You unlocked a new tier. Keep going.",
      duration: 6000,
    });
  }

  if (delta.streak.changedToday && delta.streak.current > 1) {
    toast(`🔥 ${delta.streak.current}-day streak`, { duration: 3500 });
  }

  if (delta.streak.freezeUsed) {
    toast(`❄️ Freeze used — streak rescued`, { duration: 4000 });
  }

  if (delta.streak.comebackBonus) {
    toast(`Comeback bonus claimed`, {
      description: "Your streak reset to 1 — welcome back.",
      duration: 4000,
    });
  }

  for (const b of delta.badges) {
    toast.success(`Badge unlocked: ${b.name}`, {
      description: b.description,
      duration: 6000,
    });
  }
}
