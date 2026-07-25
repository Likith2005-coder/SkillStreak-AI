import { RequestHandler } from "express";
import { z } from "zod";
import * as domainService from "../services/domain.service";
import * as interviewService from "../services/interview.service";
import * as personalizationService from "../services/personalization.service";
import { ApiError } from "../middleware/error.middleware";

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(100),
});

export const assessmentBodySchema = z.object({
  why: z.string().min(1).max(60),
  level: z.enum(["beginner", "basic", "intermediate", "advanced"]),
  learnedBefore: z.boolean(),
  knownTopics: z.array(z.string().max(120)).max(30),
  dailyMinutes: z.number().int().min(5).max(600),
  style: z.string().min(1).max(30),
  mode: z.string().min(1).max(30),
  endGoal: z.string().min(1).max(80),
  wantsCert: z.boolean(),
  certification: z.string().max(80).nullable(),
  languages: z.array(z.string().max(30)).max(10),
  os: z.enum(["windows", "linux", "macos"]),
});

const slug = (req: { params: Record<string, unknown> }) => req.params.slug as string;

export const list: RequestHandler = async (_req, res) => {
  const domains = await domainService.listDomains();
  res.json({ domains });
};

export const getBySlug: RequestHandler = async (req, res) => {
  const domain = await domainService.getDomainBySlug(slug(req));
  res.json({ domain });
};

export const getRoadmap: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const domain = await domainService.getRoadmapForUser(slug(req), req.user.sub);
  res.json({ domain });
};

export const interviewStatus: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const gate = await interviewService.isDomainCompleted(slug(req), req.user.sub);
  res.json(gate);
};

export const interviewPrep: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const result = await interviewService.getInterviewPrep(slug(req), req.user.sub);
  res.json(result);
};

export const assessmentQuestions: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const result = await personalizationService.getAssessmentQuestions(slug(req));
  res.json(result);
};

export const submitAssessment: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const answers = req.body as personalizationService.AssessmentAnswers;
  const result = await personalizationService.submitAssessment(slug(req), req.user.sub, answers);
  res.json(result);
};

export const personalizedPlan: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const result = await personalizationService.getPlan(slug(req), req.user.sub);
  res.json(result);
};
