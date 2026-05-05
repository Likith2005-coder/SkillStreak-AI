process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/skillstreak_test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-must-be-at-least-sixteen-chars";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_ROUNDS = "4";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";
process.env.LLM_PROVIDER = "gemini";
