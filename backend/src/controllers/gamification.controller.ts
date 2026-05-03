import { RequestHandler } from "express";
import * as g from "../services/gamification.service";
import { ApiError } from "../middleware/error.middleware";

export const streak: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const data = await g.getStreak(req.user.sub);
  res.json(data);
};

export const useFreeze: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const data = await g.spendFreeze(req.user.sub);
  res.json(data);
};

export const badges: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const data = await g.getBadges(req.user.sub);
  res.json({ badges: data });
};

export const leaderboard: RequestHandler = async (_req, res) => {
  const data = await g.getLeaderboard();
  res.json({ entries: data });
};
