import { prisma } from "../src/config/db";
async function main() {
  const r = await prisma.resource.deleteMany({});
  console.log(`Cleared ${r.count} resource rows.`);
  await prisma.$disconnect();
}
main();
