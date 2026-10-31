import { Router } from "express";
import * as ctl from "../controllers/review.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

router.get("/", requireAuth, asyncHandler(ctl.list));
router.post("/answer", requireAuth, validate(ctl.answerBodySchema, "body"), asyncHandler(ctl.answer));

export default router;
