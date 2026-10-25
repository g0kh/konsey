import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { buildDisplayName, slugifyUsername } from "@/lib/auth";
import { hashPassword } from "@/lib/auth-password";
import { logAdminAction, requireAdmin } from "@/lib/admin-auth";
import { BRANCHES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      username?: string;
      branch?: string;
      role?: UserRole;
      password?: string;
      isActive?: boolean;
    };

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    const data: {
      firstName?: string;
      lastName?: string;
      name?: string;
      username?: string;
      branch?: string;
      role?: UserRole;
      passwordHash?: string;
      isActive?: boolean;
    } = {};

    if (body.firstName?.trim()) {
      data.firstName = body.firstName.trim();
    }
    if (body.lastName?.trim()) {
      data.lastName = body.lastName.trim();
    }
    if (data.firstName || data.lastName) {
      data.name = buildDisplayName(
        data.firstName ?? existing.firstName,
        data.lastName ?? existing.lastName,
      );
    }
    if (body.username?.trim()) {
      const username = slugifyUsername(body.username.trim());
      const taken = await prisma.user.findFirst({
        where: { username, NOT: { id } },
      });
      if (taken) {
        return NextResponse.json({ error: "Bu kullanıcı adı kullanılıyor" }, { status: 400 });
      }
      data.username = username;
    }
    if (body.branch?.trim()) {
      if (!BRANCHES.includes(body.branch as (typeof BRANCHES)[number])) {
        return NextResponse.json({ error: "Geçersiz branş" }, { status: 400 });
      }
      data.branch = body.branch.trim();
    }
    if (body.role) {
      data.role = body.role;
    }
    if (body.password?.trim()) {
      if (body.password.length < 6) {
        return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır" }, { status: 400 });
      }
      data.passwordHash = await hashPassword(body.password);
    }
    if (typeof body.isActive === "boolean") {
      data.isActive = body.isActive;
    }

    const updated = await prisma.user.update({ where: { id }, data });

    await logAdminAction(auth.user.id, "user_update", "User", id, updated.username);

    return NextResponse.json({
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      name: updated.name,
      username: updated.username,
      branch: updated.branch,
      role: updated.role,
      isActive: updated.isActive,
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const { id } = await context.params;

    if (id === auth.user.id) {
      return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz" }, { status: 400 });
    }

    const presentationCount = await prisma.councilPresentation.count({
      where: { submittedByUserId: id },
    });

    if (presentationCount > 0) {
      return NextResponse.json(
        {
          error: `Bu kullanıcının ${presentationCount} sunumu var. Silinemez.`,
        },
        { status: 400 },
      );
    }

    await prisma.authSession.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    await logAdminAction(auth.user.id, "user_delete", "User", id, "Kullanıcı silindi");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
