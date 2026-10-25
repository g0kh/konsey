import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { buildDisplayName } from "@/lib/auth";
import { hashPassword } from "@/lib/auth-password";
import { generateUniqueUsername } from "@/lib/auth";
import { logAdminAction, requireAdmin } from "@/lib/admin-auth";
import { parseCsv } from "@/lib/admin-utils";
import { BRANCHES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const DEFAULT_IMPORT_PASSWORD = "Degistir123!";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = (await request.json()) as { csv?: string; confirm?: boolean };
    const rows = parseCsv(body.csv ?? "");

    if (rows.length < 2) {
      return NextResponse.json({ error: "Geçerli CSV verisi gerekli" }, { status: 400 });
    }

    const header = rows[0].map((h) => h.toLowerCase());
    const adIdx = header.findIndex((h) => h.includes("ad") && !h.includes("soyad"));
    const soyadIdx = header.findIndex((h) => h.includes("soyad"));
    const bransIdx = header.findIndex((h) => h.includes("bran"));
    const rolIdx = header.findIndex((h) => h.includes("rol"));

    const preview: {
      firstName: string;
      lastName: string;
      name: string;
      branch: string;
      role: UserRole;
      error?: string;
    }[] = [];

    for (const row of rows.slice(1)) {
      const firstName = row[adIdx] ?? "";
      const lastName = row[soyadIdx] ?? "";
      const branch = row[bransIdx] ?? "";
      const roleRaw = (row[rolIdx] ?? "DOCTOR").toUpperCase();
      const name = buildDisplayName(firstName, lastName);
      const role = (["ADMIN", "DOCTOR", "READONLY"].includes(roleRaw)
        ? roleRaw
        : "DOCTOR") as UserRole;

      let error: string | undefined;
      if (!firstName || !lastName) {
        error = "Ad/soyad eksik";
      } else if (!BRANCHES.includes(branch as (typeof BRANCHES)[number])) {
        error = `Geçersiz branş: ${branch}`;
      }

      preview.push({ firstName, lastName, name, branch, role, error });
    }

    if (!body.confirm) {
      return NextResponse.json({ preview, imported: 0, errors: preview.filter((p) => p.error).length });
    }

    let imported = 0;
    const errors: { name: string; error: string }[] = [];

    for (const item of preview) {
      if (item.error) {
        errors.push({ name: item.name, error: item.error });
        continue;
      }
      try {
        const username = await generateUniqueUsername(item.firstName, item.lastName);
        await prisma.user.create({
          data: {
            firstName: item.firstName,
            lastName: item.lastName,
            name: item.name,
            username,
            passwordHash: await hashPassword(DEFAULT_IMPORT_PASSWORD),
            branch: item.branch,
            role: item.role,
          },
        });
        imported += 1;
      } catch {
        errors.push({ name: item.name, error: "Kayıt oluşturulamadı" });
      }
    }

    await logAdminAction(
      auth.user.id,
      "bulk_user_import",
      "User",
      "bulk",
      `${imported} kullanıcı eklendi`,
    );

    return NextResponse.json({ imported, errors, preview });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "İçe aktarma başarısız" }, { status: 500 });
  }
}
