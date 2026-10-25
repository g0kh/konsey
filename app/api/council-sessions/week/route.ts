import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const sessions = await prisma.councilSession.findMany({
      where: {
        sessionDate: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      },
      orderBy: { sessionDate: "asc" },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { presentations: true } },
      },
    });

    const result = sessions.map((session) => ({
      id: session.id,
      councilType: session.councilType,
      sessionDate: session.sessionDate.toISOString(),
      notes: session.notes,
      createdBy: session.createdBy,
      presentationCount: session._count.presentations,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Council sessions fetch error:", error);
    return NextResponse.json(
      { error: "Konsey oturumları yüklenemedi" },
      { status: 500 },
    );
  }
}
