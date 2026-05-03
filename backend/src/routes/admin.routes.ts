import { Router } from "express";
import * as ctl from "../controllers/admin.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

// All /admin/* routes are auth + admin-gated.
router.use(requireAuth, requireAdmin);

router.get("/topics", asyncHandler(ctl.listTopics));
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

router.get("/metrics", asyncHandler(ctl.metrics));
router.get("/email/status", asyncHandler(ctl.emailStatus));

// Manual notification triggers
router.post("/email/test/streak", asyncHandler(ctl.sendTestStreak));
router.post("/email/test/digest", asyncHandler(ctl.sendTestDigest));
router.post("/email/dispatch/streaks", asyncHandler(ctl.dispatchStreaks));
router.post("/email/dispatch/digests", asyncHandler(ctl.dispatchDigests));

export default router;
