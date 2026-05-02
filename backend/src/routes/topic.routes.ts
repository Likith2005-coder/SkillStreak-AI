import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as ctl from "../controllers/topic.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

// Cap LLM-backed explanations per user to limit cost on cache misses.
// Cached responses are cheap and counted against this too — that's fine.
const explainLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.get("/:id", requireAuth, validate(ctl.idParamSchema, "params"), asyncHandler(ctl.getOne));
router.post(
  "/:id/explain",
  requireAuth,
  explainLimiter,
  validate(ctl.idParamSchema, "params"),
  asyncHandler(ctl.explain)
);
router.post(
  "/:id/complete",
  requireAuth,
  validate(ctl.idParamSchema, "params"),
  asyncHandler(ctl.complete)
);

export default router;
