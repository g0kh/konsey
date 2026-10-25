import { execSync } from "child_process";
import { PrismaClient, UserRole } from "@prisma/client";
import { BRANCHES } from "@/lib/constants";

export const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

let migrationsApplied = false;

export async function runMigrations(): Promise<void> {
  if (migrationsApplied) {
    return;
  }

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
  migrationsApplied = true;
}

export async function truncateAllTables(): Promise<void> {
  await testPrisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "SupplementaryOpinion",
      "PresentationAttendee",
      "CouncilSessionAttendee",
      "CouncilSessionPresentation",
      "BranchComment",
      "QuickConsult",
      "CouncilPresentation",
      "CouncilSession",
      "Patient",
      "User"
    RESTART IDENTITY CASCADE
  `);
}

export async function seedBaseUsers(): Promise<
  Record<string, Awaited<ReturnType<typeof testPrisma.user.create>>>
> {
  const users: Record<string, Awaited<ReturnType<typeof testPrisma.user.create>>> =
    {};

  for (const branch of BRANCHES) {
    const user = await testPrisma.user.create({
      data: {
        name: `Dr. Test ${branch}`,
        branch,
        role: branch === "Tıbbi Onkoloji" ? UserRole.ADMIN : UserRole.DOCTOR,
      },
    });
    users[branch] = user;
  }

  return users;
}

export async function disconnectTestDb(): Promise<void> {
  await testPrisma.$disconnect();
}
