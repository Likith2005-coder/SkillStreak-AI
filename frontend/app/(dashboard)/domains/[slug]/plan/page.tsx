import type { Metadata } from "next";
import { PlanClient } from "./PlanClient";

export const metadata: Metadata = {
  title: "Your personalized plan — SkillStreak AI",
};

export default function PlanPage() {
  return <PlanClient />;
}
