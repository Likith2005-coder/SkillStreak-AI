import { PrismaClient } from "@prisma/client";
import { isDev } from "./env";

export const prisma = new PrismaClient({
  log: isDev ? ["query", "error", "warn"] : ["error"],
});

export async function pingDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
