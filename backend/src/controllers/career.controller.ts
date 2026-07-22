import { RequestHandler } from "express";
import { z } from "zod";
import { ApiError } from "../middleware/error.middleware";
import * as careerService from "../services/career.service";

export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/u, "Invalid domain slug"),
});

export const getCareerPath: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const { slug } = req.params as z.infer<typeof slugParamSchema>;
  const result = await careerService.getCareerPath(slug, req.user.sub);
  res.json(result);
};
