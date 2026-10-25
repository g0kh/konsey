import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const TABLES = [
  { name: "User", model: "user" as const },
  { name: "Patient", model: "patient" as const },
  { name: "CouncilPresentation", model: "councilPresentation" as const },
  { name: "QuickConsult", model: "quickConsult" as const },
  { name: "BranchComment", model: "branchComment" as const },
  { name: "CouncilSession", model: "councilSession" as const },
  { name: "CouncilSessionPresentation", model: "councilSessionPresentation" as const },
  { name: "AdminAuditLog", model: "adminAuditLog" as const },
] as const;

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.councilPresentation.count(),
      prisma.quickConsult.count(),
      prisma.branchComment.count(),
      prisma.councilSession.count(),
      prisma.councilSessionPresentation.count(),
      prisma.adminAuditLog.count(),
    ]);

    const latest = await Promise.all([
      prisma.user.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      prisma.patient.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
      prisma.councilPresentation.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
      prisma.quickConsult.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      prisma.branchComment.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
      prisma.councilSession.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      prisma.councilSessionPresentation.findFirst({
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
      }),
      prisma.adminAuditLog.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    ]);

    const tables = TABLES.map((table, index) => ({
      table: table.name,
      count: counts[index],
      lastUpdated:
        latest[index] &&
        ("createdAt" in latest[index]!
          ? latest[index]!.createdAt
          : "updatedAt" in latest[index]!
            ? latest[index]!.updatedAt
            : null)
          ? (
              (latest[index] as { createdAt?: Date; updatedAt?: Date }).createdAt ??
              (latest[index] as { updatedAt?: Date }).updatedAt
            )?.toISOString() ?? null
          : null,
      approxSizeKb: counts[index] * 2,
    }));

    return NextResponse.json({ tables, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("DB stats error:", error);
    return NextResponse.json({ error: "İstatistikler yüklenemedi" }, { status: 500 });
  }
}
