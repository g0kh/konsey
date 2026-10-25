import { PrismaClient, UserRole } from "@prisma/client";
import { buildDisplayName } from "../lib/auth";
import { hashPassword } from "../lib/auth-password";

const prisma = new PrismaClient();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "9502457Ab!";

async function main() {
  const existing = await prisma.user.findUnique({
    where: { username: ADMIN_USERNAME },
  });

  if (existing) {
    console.log("Admin kullanıcı zaten var, seed atlandı.");
    return;
  }

  await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "Kullanıcı",
      name: buildDisplayName("Admin", "Kullanıcı"),
      username: ADMIN_USERNAME,
      passwordHash: await hashPassword(ADMIN_PASSWORD),
      branch: "Tıbbi Onkoloji",
      role: UserRole.ADMIN,
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
