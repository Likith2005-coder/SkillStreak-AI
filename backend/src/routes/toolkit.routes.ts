import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as ctl from "../controllers/toolkit.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

// LLM-backed guide generation — cap per user to limit cost on cache misses.
const guideLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.get("/", requireAuth, asyncHandler(ctl.list));
router.get(
  "/tools/:slug",
  requireAuth,
  validate(ctl.slugParamSchema, "params"),
  asyncHandler(ctl.getTool)
);
router.post(
  "/tools/:slug/guide",
  requireAuth,
  guideLimiter,
  validate(ctl.slugParamSchema, "params"),
  asyncHandler(ctl.getGuide)
);

export default router;
