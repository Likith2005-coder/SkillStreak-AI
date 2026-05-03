import { Router } from "express";
import * as ctl from "../controllers/progress.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/", requireAuth, asyncHandler(ctl.overview));
router.get(
  "/domain/:slug",
  requireAuth,
  validate(ctl.slugParamSchema, "params"),
  asyncHandler(ctl.domain)
);
router.get("/heatmap", requireAuth, asyncHandler(ctl.heatmap));

export default router;
