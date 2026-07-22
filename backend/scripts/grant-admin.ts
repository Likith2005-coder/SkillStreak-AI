/**
 * Bootstrap / manage admin access from the version-controlled allowlist.
 *
 *   npm --workspace @skillstreak/backend run grant-admin
 *   npm --workspace @skillstreak/backend run grant-admin -- extra@email.com
 *
 * Reads admin/config/admins.json and promotes every listed email (plus any
 * passed on the CLI) to the `admin` role. Accounts must already be registered
 * on the learner site. Idempotent — safe to re-run.
 */

import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/config/db";

function readAllowlist(): string[] {
  const p = path.join(process.cwd(), "..", "admin", "config", "admins.json");
  if (!fs.existsSync(p)) {
    console.warn(`No allowlist at ${p} — using CLI args only.`);
    return [];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(p, "utf8")) as { admins?: unknown };
    return Array.isArray(parsed.admins) ? parsed.admins.filter((x): x is string => typeof x === "string") : [];
  } catch (err) {
    console.error("Failed to parse admins.json:", err instanceof Error ? err.message : err);
    return [];
  }
}

async function main() {
  const cliEmails = process.argv.slice(2).map((s) => s.trim()).filter(Boolean);
  const emails = [...new Set([...readAllowlist(), ...cliEmails].map((e) => e.toLowerCase()))];

  if (emails.length === 0) {
    console.log("No emails to grant. Add some to admin/config/admins.json or pass them as arguments.");
    return;
  }

  console.log(`Granting admin to ${emails.length} email(s)…\n`);
  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, name: true } });
    if (!user) {
      console.log(`  ✗ ${email.padEnd(34)} not registered — sign up on the learner site first`);
      continue;
    }
    if (user.role === "admin") {
      console.log(`  = ${email.padEnd(34)} already admin`);
      continue;
    }
    await prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
    console.log(`  ✓ ${email.padEnd(34)} promoted to admin`);
  }

  const count = await prisma.user.count({ where: { role: "admin" } });
  console.log(`\nDone. ${count} admin account(s) total.`);
}

main()
  .catch((err) => { console.error("grant-admin failed:", err); process.exit(1); })
  .finally(() => prisma.$disconnect());
