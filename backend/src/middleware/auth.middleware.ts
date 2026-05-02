import { RequestHandler } from "express";
import { verifyToken } from "../utils/jwt.util";
import { ApiError } from "./error.middleware";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing or invalid Authorization header"));
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) return next(new ApiError(401, "Missing bearer token"));

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, "Unauthenticated"));
  if (req.user.role !== "admin") return next(new ApiError(403, "Admin only"));
  next();
};
