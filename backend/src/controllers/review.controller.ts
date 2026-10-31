import { RequestHandler } from "express";
import { z } from "zod";
import * as reviewService from "../services/review.service";
import { ApiError } from "../middleware/error.middleware";

export const answerBodySchema = z.object({
  key: z.string().regex(/^[a-f0-9]{20}$/, "Invalid review key"),
  selectedIndex: z.number().int().min(0).max(3),
});

export const list: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const data = await reviewService.getReview(req.user.sub);
  res.json(data);
};

export const answer: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const body = req.body as z.infer<typeof answerBodySchema>;
  const data = await reviewService.answerReview({
    userId: req.user.sub,
    key: body.key,
    selectedIndex: body.selectedIndex,
  });
  res.json(data);
};
