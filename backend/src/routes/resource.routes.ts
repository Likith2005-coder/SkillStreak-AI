import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as ctl from "../controllers/resource.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

// Resource generation hits the LLM; cap fresh requests.
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.get(
  "/topics/:id",
  requireAuth,
  generateLimiter,
  validate(ctl.idParamSchema, "params"),
  asyncHandler(ctl.getForTopic)
);

router.get("/recommendations", requireAuth, asyncHandler(ctl.recommendations));

export default router;
