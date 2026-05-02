import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = {
  sub: string;        // user id
  email: string;
  role: "user" | "admin";
};

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || !decoded || typeof decoded !== "object") {
    throw new Error("Invalid token payload");
  }
  const { sub, email, role } = decoded as Record<string, unknown>;
  if (typeof sub !== "string" || typeof email !== "string" || (role !== "user" && role !== "admin")) {
    throw new Error("Malformed token payload");
  }
  return { sub, email, role };
}
