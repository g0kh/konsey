import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const [submitted, completed, withDecision] = await Promise.all([
    prisma.councilPresentation.count({
      where: { createdAt: { gte: start, lte: end } },
    }),
    prisma.councilPresentation.count({
      where: {
        status: "COMPLETED",
        councilDecisionAt: { gte: start, lte: end },
      },
    }),
    prisma.councilPresentation.findMany({
      where: {
        status: "COMPLETED",
        councilDecisionAt: { gte: start, lte: end },
      },
      include: {
        patient: { select: { firstName: true, lastName: true, tcNo: true } },
        councilDecisionBy: { select: { name: true } },
      },
      orderBy: { councilDecisionAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    year,
    month,
    summary: {
      submitted,
      completed,
      decisions: withDecision.length,
    },
    completedPresentations: withDecision.map((p) => ({
      id: p.id,
      patient: `${p.patient.firstName} ${p.patient.lastName}`,
      tcNo: p.patient.tcNo,
      councilType: p.councilType,
      councilDecision: p.councilDecision,
      decidedBy: p.councilDecisionBy?.name ?? "—",
      decidedAt: p.councilDecisionAt?.toISOString() ?? null,
    })),
  });
}
