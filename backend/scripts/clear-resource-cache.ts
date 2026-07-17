/**
 * One-off: clear cached resource rows so topics regenerate with the fixed
 * video-resolution logic (no more hallucinated dead YouTube links).
 *
 * Run: npx tsx scripts/clear-resource-cache.ts
 */
import { prisma } from "../src/config/db";

async function main() {
  const { count } = await prisma.resource.deleteMany({});
  console.log(`Deleted ${count} cached resource rows. Topics will regenerate on next visit.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
