import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as ctl from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

// Tight bucket on login/register to slow brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.post("/register", authLimiter, validate(ctl.registerSchema), asyncHandler(ctl.register));
router.post("/login", authLimiter, validate(ctl.loginSchema), asyncHandler(ctl.login));
router.get("/me", requireAuth, asyncHandler(ctl.me));
router.patch("/me/profile", requireAuth, validate(ctl.profileSchema), asyncHandler(ctl.updateProfile));
router.post("/logout", requireAuth, ctl.logout);

export default router;
