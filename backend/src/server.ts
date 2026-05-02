import { createApp } from "./app";
import { env } from "./config/env";
import { log } from "./utils/logger.util";

const app = createApp();

const server = app.listen(env.PORT, () => {
  log.info(`SkillStreak backend running on http://localhost:${env.PORT}`, {
    env: env.NODE_ENV,
    frontendOrigin: env.FRONTEND_ORIGIN,
  });
});

const shutdown = (signal: string) => {
  log.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    log.info("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
