import { Router } from "express";
import * as ctl from "../controllers/admin.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

// All /admin/* routes are auth + admin-gated.
router.use(requireAuth, requireAdmin);

// ─── Topics ─────────────────────────────────────────────────
router.get("/topics", validate(ctl.topicQuerySchema, "query"), asyncHandler(ctl.listTopics));
router.post("/topics", validate(ctl.createTopicSchema, "body"), asyncHandler(ctl.createTopic));
router.patch(
  "/topics/:id",
  validate(ctl.idParamSchema, "params"),
  validate(ctl.updateTopicSchema, "body"),
  asyncHandler(ctl.updateTopic)
);
router.delete(
  "/topics/:id",
  validate(ctl.idParamSchema, "params"),
  asyncHandler(ctl.deleteTopic)
);

// ─── Users ──────────────────────────────────────────────────
router.get("/users", asyncHandler(ctl.listUsers));
router.patch(
  "/users/:id",
  validate(ctl.idParamSchema, "params"),
  validate(ctl.updateUserSchema, "body"),
  asyncHandler(ctl.updateUser)
);
router.delete(
  "/users/:id",
  validate(ctl.idParamSchema, "params"),
  asyncHandler(ctl.deleteUser)
);
router.post(
  "/users/:id/reset-progress",
  validate(ctl.idParamSchema, "params"),
  asyncHandler(ctl.resetUserProgress)
);

// ─── Interview prep ─────────────────────────────────────────
router.post(
  "/interview/:slug/regenerate",
  validate(ctl.slugParamSchema, "params"),
  asyncHandler(ctl.regenerateInterview)
);

// ─── Metrics + email triggers ───────────────────────────────
router.get("/metrics", asyncHandler(ctl.metrics));
router.get("/email/status", asyncHandler(ctl.emailStatus));
router.post("/email/test/streak", asyncHandler(ctl.sendTestStreak));
router.post("/email/test/digest", asyncHandler(ctl.sendTestDigest));
router.post("/email/dispatch/streaks", asyncHandler(ctl.dispatchStreaks));
router.post("/email/dispatch/digests", asyncHandler(ctl.dispatchDigests));

export default router;
