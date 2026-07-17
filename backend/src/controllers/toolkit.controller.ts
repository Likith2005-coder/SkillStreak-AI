import { RequestHandler } from "express";
import { z } from "zod";
import * as toolkit from "../services/toolkit.service";
import { ApiError } from "../middleware/error.middleware";

export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Invalid tool slug"),
});

const slug = (req: { params: Record<string, unknown> }) => req.params.slug as string;

export const list: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  res.json({ phases: toolkit.getArsenal() });
};

export const getTool: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const { tool, phase } = toolkit.getToolWithPhase(slug(req));
  res.json({ tool, phase });
};

export const getGuide: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const result = await toolkit.getToolGuide(slug(req));
  res.json(result);
};
