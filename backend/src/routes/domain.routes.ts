import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as ctl from "../controllers/domain.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/", requireAuth, asyncHandler(ctl.list));
router.get("/:slug", requireAuth, validate(ctl.slugParamSchema, "params"), asyncHandler(ctl.getBySlug));

// Cheap status — UI polls this to render locked/unlocked CTAs.
router.get(
  "/:slug/interview/status",
  requireAuth,
  validate(ctl.slugParamSchema, "params"),
  asyncHandler(ctl.interviewStatus)
);

// Expensive: LLM-generated interview prep. Rate-limit tightly.
const interviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 6,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
router.get(
  "/:slug/interview",
  requireAuth,
  interviewLimiter,
  validate(ctl.slugParamSchema, "params"),
  asyncHandler(ctl.interviewPrep)
);

// ── Personalized onboarding assessment + plan ──────────────────────────
router.get(
  "/:slug/assessment",
  requireAuth,
  validate(ctl.slugParamSchema, "params"),
  asyncHandler(ctl.assessmentQuestions)
);

// Expensive: one large LLM generation per submit. Rate-limit tightly.
const assessmentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 4,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
router.post(
  "/:slug/assessment",
  requireAuth,
  assessmentLimiter,
  validate(ctl.slugParamSchema, "params"),
  validate(ctl.assessmentBodySchema, "body"),
  asyncHandler(ctl.submitAssessment)
);

router.get(
  "/:slug/plan",
  requireAuth,
  validate(ctl.slugParamSchema, "params"),
  asyncHandler(ctl.personalizedPlan)
);

export default router;

// Roadmap is exposed at /api/roadmap/:slug to match planning §13.
export const roadmapRouter = Router();
roadmapRouter.get(
  "/:slug",
  requireAuth,
  validate(ctl.slugParamSchema, "params"),
  asyncHandler(ctl.getRoadmap)
);
