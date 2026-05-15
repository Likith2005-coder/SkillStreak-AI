import { prisma } from "../src/config/db";
async function main() {
  const all = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(`${all.length} users total:`);
  for (const u of all) {
    console.log(`  ${u.role === "admin" ? "[ADMIN]" : "[user] "} ${u.email}  (${u.name})`);
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
