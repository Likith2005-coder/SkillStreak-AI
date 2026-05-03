import { RequestHandler } from "express";
import { z } from "zod";
import * as resourceService from "../services/resource.service";
import * as recommender from "../services/recommender.service";
import { ApiError } from "../middleware/error.middleware";

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid topic id"),
});

const tid = (req: { params: Record<string, unknown> }) => req.params.id as string;

export const getForTopic: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const data = await resourceService.getResources(tid(req));
  res.json(data);
};

export const recommendations: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const limitRaw = req.query.limit;
  const limit = typeof limitRaw === "string" ? Math.min(20, Math.max(1, parseInt(limitRaw, 10) || 6)) : 6;
  const data = await recommender.getRecommendations(req.user.sub, limit);
  res.json({ recommendations: data });
};
