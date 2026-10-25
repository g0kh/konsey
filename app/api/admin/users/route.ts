import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { buildDisplayName, generateUniqueUsername } from "@/lib/auth";
import { hashPassword } from "@/lib/auth-password";
import { logAdminAction, requireAdmin } from "@/lib/admin-auth";
import { BRANCHES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: [{ branch: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            submittedPresentations: true,
            branchComments: true,
          },
        },
      },
    });

    return NextResponse.json(
      users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        username: user.username,
        branch: user.branch,
        role: user.role,
        isActive: user.isActive,
        presentationCount: user._count.submittedPresentations,
        commentCount: user._count.branchComments,
        createdAt: user.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json({ error: "Kullanıcılar yüklenemedi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      username?: string;
      branch?: string;
      role?: UserRole;
      password?: string;
      isActive?: boolean;
    };

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const branch = body.branch?.trim();
    const role = body.role ?? "DOCTOR";
    const password = body.password ?? "Degistir123!";

    if (!firstName || !lastName || !branch) {
      return NextResponse.json({ error: "İsim, soyisim ve branş zorunludur" }, { status: 400 });
    }

    if (!BRANCHES.includes(branch as (typeof BRANCHES)[number])) {
      return NextResponse.json({ error: "Geçersiz branş" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır" }, { status: 400 });
    }

    const username =
      body.username?.trim().toLocaleLowerCase("tr-TR") ||
      (await generateUniqueUsername(firstName, lastName));

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: "Bu kullanıcı adı kullanılıyor" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: buildDisplayName(firstName, lastName),
        username,
        passwordHash: await hashPassword(password),
        branch,
        role,
        isActive: body.isActive ?? true,
      },
    });

    await logAdminAction(
      auth.user.id,
      "user_create",
      "User",
      user.id,
      user.username,
    );

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      username: user.username,
      branch: user.branch,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Admin user create error:", error);
    return NextResponse.json({ error: "Kullanıcı oluşturulamadı" }, { status: 500 });
  }
}
