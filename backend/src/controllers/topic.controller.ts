import { RequestHandler } from "express";
import { z } from "zod";
import * as topicService from "../services/topic.service";
import { ApiError } from "../middleware/error.middleware";

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid topic id"),
});

// validate(idParamSchema, "params") runs before each handler, so id is a string here.
const id = (req: { params: Record<string, unknown> }) => req.params.id as string;

export const getOne: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const topic = await topicService.getTopicForUser(id(req), req.user.sub);
  res.json({ topic });
};

export const explain: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const result = await topicService.explainTopic(id(req), req.user.sub);
  res.json(result);
};

export const complete: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const result = await topicService.markTopicComplete(id(req), req.user.sub);
  res.json(result);
};
