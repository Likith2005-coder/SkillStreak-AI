import { RequestHandler } from "express";
import { z } from "zod";
import * as progressService from "../services/progress.service";
import { ApiError } from "../middleware/error.middleware";

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(64),
});

const slug = (req: { params: Record<string, unknown> }) => req.params.slug as string;

export const overview: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const data = await progressService.getOverview(req.user.sub);
  res.json(data);
};

export const domain: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const data = await progressService.getDomainProgress(slug(req), req.user.sub);
  res.json(data);
};

export const heatmap: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const data = await progressService.getHeatmap(req.user.sub);
  res.json(data);
};
