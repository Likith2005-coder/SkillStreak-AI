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

// Cuids are not uuids — match minimal length instead of .uuid()
export const idParamSchema = z.object({
  id: z.string().min(1, "Invalid id").max(200),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(100),
});

// ─── Topic schemas ──────────────────────────────────────────

export const topicQuerySchema = z.object({
  domainSlug: z.string().min(1).max(100).optional(),
  phase: z.enum(["foundations", "core", "advanced"]).optional(),
  search: z.string().min(1).max(200).optional(),
});

export const createTopicSchema = z.object({
  domainSlug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  difficulty: z.enum(["easy", "standard", "hard"]),
  phase: z.enum(["foundations", "core", "advanced"]),
});

export const updateTopicSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().min(1).max(500).optional(),
  difficulty: z.enum(["easy", "standard", "hard"]).optional(),
  phase: z.enum(["foundations", "core", "advanced"]).optional(),
});

// ─── User schemas ───────────────────────────────────────────

export const updateUserSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  name: z.string().min(1).max(100).optional(),
});

const id = (req: { params: Record<string, unknown> }) => req.params.id as string;
const slug = (req: { params: Record<string, unknown> }) => req.params.slug as string;

// ─── Topics ─────────────────────────────────────────────────

export const listTopics: RequestHandler = async (req, res) => {
  const q = req.query as z.infer<typeof topicQuerySchema>;
  const topics = await adminService.listTopicsForAdmin({
    domainSlug: q.domainSlug,
    phase: q.phase,
    search: q.search,
  });
  res.json({ topics });
};

export const createTopic: RequestHandler = async (req, res) => {
  const body = req.body as z.infer<typeof createTopicSchema>;
  const topic = await adminService.createTopic(body);
  res.status(201).json({ topic });
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

// ─── Users ──────────────────────────────────────────────────

export const listUsers: RequestHandler = async (_req, res) => {
  const users = await adminService.listUsers();
  res.json({ users });
};

export const updateUser: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const body = req.body as z.infer<typeof updateUserSchema>;
  const user = await adminService.updateUser(id(req), body, req.user.sub);
  res.json({ user });
};

export const deleteUser: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  await adminService.deleteUser(id(req), req.user.sub);
  res.status(204).end();
};

export const resetUserProgress: RequestHandler = async (req, res) => {
  await adminService.resetUserProgress(id(req));
  res.json({ reset: true });
};

// ─── Content / interview prep ───────────────────────────────

export const regenerateInterview: RequestHandler = async (req, res) => {
  const result = await adminService.clearInterviewCache(slug(req));
  res.json(result);
};

// ─── Metrics + email triggers (existing) ───────────────────

export const metrics: RequestHandler = async (_req, res) => {
  const data = await adminService.getMetrics();
  res.json(data);
};

export const emailStatus: RequestHandler = async (_req, res) => {
  res.json({ configured: isEmailConfigured() });
};

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
