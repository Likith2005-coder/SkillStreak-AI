import { RequestHandler } from "express";
import { z } from "zod";
import * as quizService from "../services/quiz.service";
import { ApiError } from "../middleware/error.middleware";

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid topic id"),
});

export const generateBodySchema = z.object({
  fresh: z.boolean().optional().default(false),
});

export const submitBodySchema = z.object({
  answers: z.array(z.number().int().min(0).max(3)).length(5),
});

const tid = (req: { params: Record<string, unknown> }) => req.params.id as string;

export const generate: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const body = req.body as z.infer<typeof generateBodySchema>;
  const result = await quizService.generateQuiz({
    topicId: tid(req),
    userId: req.user.sub,
    fresh: body.fresh,
  });
  res.json(result);
};

export const submit: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const body = req.body as z.infer<typeof submitBodySchema>;
  const result = await quizService.submitAttempt({
    userId: req.user.sub,
    topicId: tid(req),
    answers: body.answers,
  });
  res.json(result);
};

export const history: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const attempts = await quizService.getHistory(req.user.sub);
  res.json({ attempts });
};
