import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Query logging is expensive (synchronous console I/O per query, and it floods
 * the terminal). It's off by default so requests stay fast; set PRISMA_LOG=query
 * to turn it back on when you actually need to inspect SQL.
 */
const logLevels: Prisma.LogLevel[] =
  process.env.PRISMA_LOG === "query" ? ["query", "error", "warn"] : ["error", "warn"];

export const prisma = new PrismaClient({ log: logLevels });

export async function pingDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
