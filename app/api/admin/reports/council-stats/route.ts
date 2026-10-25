import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { COUNCIL_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const to = dateTo ? new Date(`${dateTo}T23:59:59`) : new Date();

  const presentations = await prisma.councilPresentation.findMany({
    where: { createdAt: { gte: from, lte: to } },
    include: {
      submittedBy: { select: { name: true } },
    },
  });

  const stats = COUNCIL_TYPES.map((councilType) => {
    const items = presentations.filter((p) => p.councilType === councilType);
    const completed = items.filter((p) => p.status === "COMPLETED");
    const completionRate =
      items.length === 0 ? 0 : Math.round((completed.length / items.length) * 100);

    const durations = completed
      .filter((p) => p.councilDecisionAt)
      .map(
        (p) =>
          (p.councilDecisionAt!.getTime() - p.createdAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );
    const avgDays =
      durations.length === 0
        ? 0
        : Math.round(
            (durations.reduce((a, b) => a + b, 0) / durations.length) * 10,
          ) / 10;

    const submitterCounts = new Map<string, number>();
    for (const item of items) {
      submitterCounts.set(
        item.submittedBy.name,
        (submitterCounts.get(item.submittedBy.name) ?? 0) + 1,
      );
    }
    const topSubmitter =
      Array.from(submitterCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    return {
      councilType,
      total: items.length,
      completed: completed.length,
      completionRate,
      avgCompletionDays: avgDays,
      topSubmitter,
    };
  });

  return NextResponse.json({ stats, dateFrom: from.toISOString(), dateTo: to.toISOString() });
}
