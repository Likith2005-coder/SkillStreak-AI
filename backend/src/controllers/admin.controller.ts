import { RequestHandler } from "express";
import { z } from "zod";
import * as adminService from "../services/admin.service";
import {
  dispatchStreakReminders,
  dispatchWeeklyDigests,
  sendStreakReminder,
  sendWeeklyDigest,
} from "../services/notifications.service";
import { isEmailConfigured } from "../services/email.service";
import { ApiError } from "../middleware/error.middleware";

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id"),
});

export const updateTopicSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().min(1).max(500).optional(),
  difficulty: z.enum(["easy", "standard", "hard"]).optional(),
  phase: z.enum(["foundations", "core", "advanced"]).optional(),
});

const id = (req: { params: Record<string, unknown> }) => req.params.id as string;

export const listTopics: RequestHandler = async (_req, res) => {
  const topics = await adminService.listTopicsForAdmin();
  res.json({ topics });
};

export const updateTopic: RequestHandler = async (req, res) => {
  const body = req.body as z.infer<typeof updateTopicSchema>;
  const topic = await adminService.updateTopic(id(req), body);
  res.json({ topic });
};

export const deleteTopic: RequestHandler = async (req, res) => {
  await adminService.deleteTopic(id(req));
  res.status(204).end();
};

export const metrics: RequestHandler = async (_req, res) => {
  const data = await adminService.getMetrics();
  res.json(data);
};

export const emailStatus: RequestHandler = async (_req, res) => {
  res.json({ configured: isEmailConfigured() });
};

// Manual trigger endpoints — admin clicks "send" in the dashboard.
// Production would replace these with cron jobs (Phase 11).

export const sendTestStreak: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const result = await sendStreakReminder(req.user.sub);
  res.json(result);
};

export const sendTestDigest: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const result = await sendWeeklyDigest(req.user.sub);
  res.json(result);
};

export const dispatchStreaks: RequestHandler = async (_req, res) => {
  const result = await dispatchStreakReminders();
  res.json(result);
};

export const dispatchDigests: RequestHandler = async (_req, res) => {
  const result = await dispatchWeeklyDigests();
  res.json(result);
};
