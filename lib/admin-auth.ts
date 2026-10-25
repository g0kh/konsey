import type { User } from "@prisma/client";
import { NextResponse } from "next/server";
import { SUPER_ADMIN_BRANCHES } from "@/lib/constants";
import {
  getSessionUserFromRequest,
  type SessionUser,
} from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export type { SessionUser };

/** @deprecated SESSION_COOKIE_KEY kullanın */
export const USER_COOKIE_KEY = "onkoloji-konsey-session";

export async function getSessionUser(
  request: Request,
): Promise<SessionUser | null> {
  return getSessionUserFromRequest(request);
}

export async function requireAdmin(
  request: Request,
): Promise<{ user: User; session: SessionUser } | NextResponse> {
  const session = await getSessionUserFromRequest(request);

  if (!session?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });

  if (!user || user.role !== "ADMIN" || !user.isActive) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  return { user, session: { ...session, role: user.role } };
}

export function isSuperAdmin(user: User): boolean {
  return (
    user.role === "ADMIN" &&
    SUPER_ADMIN_BRANCHES.includes(user.branch as (typeof SUPER_ADMIN_BRANCHES)[number])
  );
}

export async function logAdminAction(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: string,
) {
  await prisma.adminAuditLog.create({
    data: { userId, action, entityType, entityId, details },
  });
}
