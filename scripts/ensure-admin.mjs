import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "9502457Ab!";

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt:${salt.toString("base64")}.${derived.toString("base64")}`;
}

async function main() {
  const existing = await prisma.user.findUnique({
    where: { username: ADMIN_USERNAME },
  });

  if (existing) {
    console.log("Admin kullanıcı hazır.");
    return;
  }

  await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "Kullanıcı",
      name: "Admin Kullanıcı",
      username: ADMIN_USERNAME,
      passwordHash: await hashPassword(ADMIN_PASSWORD),
      branch: "Tıbbi Onkoloji",
      role: "ADMIN",
      preferredCouncilTypes: [],
    },
  });

  console.log("Admin kullanıcı oluşturuldu.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
