import { prisma } from "../src/config/db";
async function main() {
  // Most recent user activity — gives a hint at the currently active session
  const recent = await prisma.xpEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { userId: true, createdAt: true },
  });
  if (recent.length === 0) {
    console.log("no xp events yet");
  } else {
    const u = await prisma.user.findUnique({
      where: { id: recent[0].userId },
      select: { email: true, role: true },
    });
    console.log("Most recent active user:", u?.email, "role=", u?.role);
  }
  await prisma.$disconnect();
}
main();
