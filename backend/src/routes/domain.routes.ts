import { Router } from "express";
import * as ctl from "../controllers/domain.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/", requireAuth, asyncHandler(ctl.list));
router.get("/:slug", requireAuth, validate(ctl.slugParamSchema, "params"), asyncHandler(ctl.getBySlug));

export default router;

// Roadmap is exposed at /api/roadmap/:slug to match planning §13.
export const roadmapRouter = Router();
roadmapRouter.get(
  "/:slug",
  requireAuth,
  validate(ctl.slugParamSchema, "params"),
  asyncHandler(ctl.getRoadmap)
);
