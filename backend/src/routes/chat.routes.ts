import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as ctl from "../controllers/chat.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

// Tighter limit on the streaming send endpoint — each call hits the LLM.
const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.get("/sessions", requireAuth, asyncHandler(ctl.list));
router.post(
  "/sessions",
  requireAuth,
  validate(ctl.createSessionSchema, "body"),
  asyncHandler(ctl.create)
);
router.get(
  "/sessions/:id",
  requireAuth,
  validate(ctl.idParamSchema, "params"),
  asyncHandler(ctl.getOne)
);
router.patch(
  "/sessions/:id",
  requireAuth,
  validate(ctl.idParamSchema, "params"),
  validate(ctl.renameSchema, "body"),
  asyncHandler(ctl.rename)
);
router.delete(
  "/sessions/:id",
  requireAuth,
  validate(ctl.idParamSchema, "params"),
  asyncHandler(ctl.remove)
);
router.post(
  "/sessions/:id/messages",
  requireAuth,
  sendLimiter,
  validate(ctl.idParamSchema, "params"),
  validate(ctl.sendMessageSchema, "body"),
  asyncHandler(ctl.sendMessage)
);

export default router;
