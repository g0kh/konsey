import { NextResponse } from "next/server";
import { logAdminAction, requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const days = Number(searchParams.get("days") ?? 30);

    if (type === "cancelled") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const result = await prisma.councilPresentation.deleteMany({
        where: {
          status: "CANCELLED",
          updatedAt: { lt: cutoff },
        },
      });

      await logAdminAction(
        auth.user.id,
        "cleanup_cancelled",
        "CouncilPresentation",
        "bulk",
        `${result.count} iptal kaydı silindi`,
      );

      return NextResponse.json({ deleted: result.count });
    }

    return NextResponse.json({ error: "Geçersiz temizlik türü" }, { status: 400 });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Temizlik başarısız" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const staleConsults = await prisma.quickConsult.findMany({
    where: {
      response: null,
      createdAt: { lt: sevenDaysAgo },
    },
    include: {
      presentation: {
        include: {
          patient: { select: { firstName: true, lastName: true } },
        },
      },
      requestedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    staleConsults: staleConsults.map((c) => ({
      id: c.id,
      question: c.question,
      targetBranch: c.targetBranch,
      createdAt: c.createdAt.toISOString(),
      patient: `${c.presentation.patient.firstName} ${c.presentation.patient.lastName}`,
      requestedBy: c.requestedBy.name,
      presentationId: c.presentationId,
    })),
  });
}
