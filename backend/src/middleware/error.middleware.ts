import { ErrorRequestHandler, RequestHandler } from "express";
import { log } from "../utils/logger.util";
import { isDev } from "../config/env";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

// Express 4 doesn't forward async-thrown errors to the error handler.
// Wrap async controllers with this so they don't need try/catch boilerplate.
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  log.error("Unhandled error", { message: err?.message, stack: err?.stack });

  res.status(500).json({
    error: "Internal Server Error",
    ...(isDev && { message: err?.message }),
  });
};
