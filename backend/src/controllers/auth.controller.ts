import { RequestHandler } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service";
import { ApiError } from "../middleware/error.middleware";

export const registerSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or fewer"),
  name: z.string().min(1, "Name is required").max(100),
});

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(72),
});

export const profileSchema = z.object({
  priorLevel: z.enum(["none", "some", "experienced"]),
  goal: z.enum(["interview", "awareness", "curiosity"]),
  pace: z.enum(["relaxed", "standard", "intense"]),
  preferredDomains: z.array(z.string().min(1).max(100)).max(9).optional(),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/u, "Use 24h HH:mm format")
    .nullable()
    .optional(),
});

export const register: RequestHandler = async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
};

export const login: RequestHandler = async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
};

export const me: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const user = await authService.getMe(req.user.sub);
  res.json({ user });
};

export const updateProfile: RequestHandler = async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthenticated");
  const profile = await authService.upsertProfile(req.user.sub, req.body);
  res.json({ profile });
};

export const logout: RequestHandler = (_req, res) => {
  // Stateless JWT — client drops the token. Endpoint exists for symmetry and
  // for future server-side blacklist if we move to httpOnly cookies.
  res.json({ ok: true });
};
