import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import domainRoutes, { roadmapRouter } from "./domain.routes";
import topicRoutes from "./topic.routes";
import chatRoutes from "./chat.routes";
import quizRoutes from "./quiz.routes";
import progressRoutes from "./progress.routes";
import gamificationRoutes from "./gamification.routes";
import resourceRoutes from "./resource.routes";
import toolkitRoutes from "./toolkit.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/domains", domainRoutes);
router.use("/roadmap", roadmapRouter);
router.use("/topics", topicRoutes);
router.use("/chat", chatRoutes);
router.use("/quiz", quizRoutes);
router.use("/progress", progressRoutes);
router.use("/resources", resourceRoutes);
router.use("/toolkit", toolkitRoutes);
router.use("/admin", adminRoutes);
router.use("/", gamificationRoutes);

router.get("/", (_req, res) => {
  res.json({
    name: "SkillStreak AI API",
    version: "0.1.0",
    docs: "/health",
  });
});

export default router;
