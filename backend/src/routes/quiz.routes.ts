import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as ctl from "../controllers/quiz.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

// Generation hits the LLM hard — keep it tighter than chat send.
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.get("/history", requireAuth, asyncHandler(ctl.history));

router.post(
  "/topics/:id/generate",
  requireAuth,
  generateLimiter,
  validate(ctl.idParamSchema, "params"),
  validate(ctl.generateBodySchema, "body"),
  asyncHandler(ctl.generate)
);

router.post(
  "/topics/:id/submit",
  requireAuth,
  validate(ctl.idParamSchema, "params"),
  validate(ctl.submitBodySchema, "body"),
  asyncHandler(ctl.submit)
);

export default router;
