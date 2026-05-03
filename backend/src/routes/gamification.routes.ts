import { Router } from "express";
import * as ctl from "../controllers/gamification.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/streak", requireAuth, asyncHandler(ctl.streak));
router.post("/streak/freeze", requireAuth, asyncHandler(ctl.useFreeze));
router.get("/badges", requireAuth, asyncHandler(ctl.badges));
router.get("/leaderboard", requireAuth, asyncHandler(ctl.leaderboard));

export default router;
