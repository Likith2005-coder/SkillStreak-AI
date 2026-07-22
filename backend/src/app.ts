import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env, isDev } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

export function createApp() {
  const app = express();

  app.use(helmet());
  // Compress JSON/text responses (gzip) once they clear a small size
  // threshold. Negotiated automatically via the client's Accept-Encoding
  // header; the default filter skips already-compressed types (images,
  // zip, etc.) and any response that already has a Content-Encoding.
  app.use(
    compression({
      threshold: 1024, // don't bother compressing tiny (<1 KB) payloads
    })
  );
  app.use(
    cors({
      // Main learner app + the standalone admin app run on separate origins.
      origin: [env.FRONTEND_ORIGIN, env.ADMIN_ORIGIN],
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  if (isDev) {
    app.use(morgan("dev"));
  }

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    })
  );

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
