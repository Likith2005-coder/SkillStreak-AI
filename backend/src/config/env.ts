import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:3000"),
  ADMIN_ORIGIN: z.string().url().default("http://localhost:3001"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().optional().default(""),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars").default("dev-secret-change-me-please"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_ROUNDS: z.coerce.number().int().positive().default(10),

  LLM_PROVIDER: z.enum(["openai", "anthropic", "gemini"]).default("gemini"),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default("gemini-flash-lite-latest"),

  YOUTUBE_API_KEY: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("SkillStreak AI <onboarding@resend.dev>"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isDev = env.NODE_ENV === "development";
