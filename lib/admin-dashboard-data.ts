import { prisma } from "@/lib/prisma";

const APP_VERSION = process.env.npm_package_version ?? "0.1.0";

export async function buildAdminDashboardData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const dbStart = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const dbResponseMs = Date.now() - dbStart;

  const [
    totalPatients,
    pendingPresentations,
    completedThisMonth,
    completedLastMonth,
    unansweredConsults,
    unansweredLastMonth,
    presentationsByMonth,
    presentationsByType,
    weeklyPresentations,
    recentPresentations,
    recentCompleted,
    recentConsults,
    totalRecords,
    auditLogs,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.councilPresentation.count({ where: { status: "PENDING" } }),
    prisma.councilPresentation.count({
      where: { status: "COMPLETED", councilDecisionAt: { gte: monthStart } },
    }),
    prisma.councilPresentation.count({
      where: {
        status: "COMPLETED",
        councilDecisionAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
    prisma.quickConsult.count({ where: { response: null } }),
    prisma.quickConsult.count({
      where: {
        response: null,
        createdAt: { lte: lastMonthEnd },
      },
    }),
    prisma.councilPresentation.findMany({
      where: {
        status: "COMPLETED",
        councilDecisionAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
        },
      },
      select: { councilDecisionAt: true },
    }),
    prisma.councilPresentation.groupBy({
      by: ["councilType"],
      _count: { id: true },
    }),
    prisma.councilPresentation.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true },
    }),
    prisma.councilPresentation.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        patient: { select: { firstName: true, lastName: true } },
        submittedBy: { select: { name: true } },
      },
    }),
    prisma.councilPresentation.findMany({
      where: { status: "COMPLETED" },
      orderBy: { councilDecisionAt: "desc" },
      take: 3,
      include: {
        patient: { select: { firstName: true, lastName: true } },
        councilDecisionBy: { select: { name: true } },
      },
    }),
    prisma.quickConsult.findMany({
      where: { response: { not: null } },
      orderBy: { respondedAt: "desc" },
      take: 3,
      include: {
        requestedBy: { select: { name: true } },
        respondedBy: { select: { name: true } },
        presentation: {
          include: { patient: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
    Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.councilPresentation.count(),
      prisma.quickConsult.count(),
      prisma.branchComment.count(),
    ]),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const monthlyMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }
  for (const row of presentationsByMonth) {
    if (!row.councilDecisionAt) continue;
    const d = row.councilDecisionAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
    }
  }

  const weekLabels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const weeklyMap = Array.from({ length: 8 }, (_, weekIndex) => ({
    week: `H${weekIndex + 1}`,
    count: 0,
  }));
  for (const row of weeklyPresentations) {
    const diffWeeks = Math.floor(
      (now.getTime() - row.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    const index = 7 - Math.min(7, Math.max(0, diffWeeks));
    weeklyMap[index].count += 1;
  }

  const activity = [
    ...recentPresentations.map((p) => ({
      type: "presentation_added" as const,
      description: `${p.patient.firstName} ${p.patient.lastName} sunumu eklendi`,
      userName: p.submittedBy.name,
      timestamp: p.createdAt.toISOString(),
      link: `/konsey/${p.id}`,
    })),
    ...recentCompleted.map((p) => ({
      type: "council_completed" as const,
      description: `${p.patient.firstName} ${p.patient.lastName} konseyi tamamlandı`,
      userName: p.councilDecisionBy?.name ?? "—",
      timestamp: p.councilDecisionAt?.toISOString() ?? p.updatedAt.toISOString(),
      link: `/konsey/${p.id}`,
    })),
    ...recentConsults.map((c) => ({
      type: "consult_answered" as const,
      description: `${c.presentation.patient.firstName} ${c.presentation.patient.lastName} hızlı görüş yanıtlandı`,
      userName: c.respondedBy?.name ?? "—",
      timestamp: c.respondedAt?.toISOString() ?? c.createdAt.toISOString(),
      link: `/konsey/${c.presentationId}`,
    })),
    ...auditLogs.map((log) => ({
      type: "admin_action" as const,
      description: log.details ?? log.action,
      userName: log.user.name,
      timestamp: log.createdAt.toISOString(),
      link: "/admin",
    })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 10);

  const pctChange = (current: number, previous: number) =>
    previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);

  return {
    stats: {
      totalPatients,
      pendingPresentations,
      completedThisMonth,
      unansweredConsults,
      trends: {
        completedThisMonth: pctChange(completedThisMonth, completedLastMonth),
        unansweredConsults: pctChange(unansweredConsults, unansweredLastMonth),
      },
    },
    charts: {
      monthlyActivity: Array.from(monthlyMap.entries()).map(([month, count]) => ({
        month,
        count,
      })),
      councilTypeDistribution: presentationsByType.map((row) => ({
        name: row.councilType,
        value: row._count.id,
      })),
      weeklyTrend: weeklyMap,
      weekLabels,
    },
    activity,
    system: {
      databaseConnected: true,
      responseTimeMs: dbResponseMs,
      totalRecords: totalRecords.reduce((a, b) => a + b, 0),
      lastBackup: null,
      version: APP_VERSION,
    },
  };
}

export type AdminDashboardData = Awaited<ReturnType<typeof buildAdminDashboardData>>;
