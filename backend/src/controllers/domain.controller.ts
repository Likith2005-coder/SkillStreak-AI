import { RequestHandler } from "express";
import { z } from "zod";
import * as domainService from "../services/domain.service";
import * as interviewService from "../services/interview.service";
import { ApiError } from "../middleware/error.middleware";

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(100),
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
