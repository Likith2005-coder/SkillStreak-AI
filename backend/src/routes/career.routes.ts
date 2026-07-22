import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as ctl from "../controllers/career.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

// Expensive: LLM-generated career roadmap (cache-first). Rate-limit tightly —
// a user browsing across domains still only needs a handful per minute.
const careerLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 6,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.get(
  "/:slug",
  requireAuth,
  careerLimiter,
  validate(ctl.slugParamSchema, "params"),
  asyncHandler(ctl.getCareerPath)
);

export default router;
