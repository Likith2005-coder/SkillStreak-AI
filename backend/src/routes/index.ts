import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

router.get("/", (_req, res) => {
  res.json({
    name: "SkillStreak AI API",
    version: "0.1.0",
    docs: "/health",
  });
});

export default router;
