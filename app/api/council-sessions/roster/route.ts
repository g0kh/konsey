import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth-session";
import { COUNCIL_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const body = (await request.json()) as {
      councilType?: string;
      attendeeUserIds?: string[];
    };

    const councilType = body.councilType?.trim() ?? "";
    if (!COUNCIL_TYPES.includes(councilType as (typeof COUNCIL_TYPES)[number])) {
      return NextResponse.json({ error: "Geçersiz konsey türü" }, { status: 400 });
    }

    if (
      session.role !== "ADMIN" &&
      !session.preferredCouncilTypes.includes(councilType)
    ) {
      return NextResponse.json(
        { error: "Bu konseye üye değilsiniz" },
        { status: 403 },
      );
    }

    const attendeeUserIds = Array.from(new Set(body.attendeeUserIds ?? [])).filter(
      Boolean,
    );
    if (attendeeUserIds.length === 0) {
      return NextResponse.json(
        { error: "Konseyde bulunan en az bir hekim seçin" },
        { status: 400 },
      );
    }

    const users = await prisma.user.findMany({
      where: { id: { in: attendeeUserIds }, isActive: true },
      select: { id: true },
    });

    if (users.length !== attendeeUserIds.length) {
      return NextResponse.json(
        { error: "Seçilen hekimlerden bazıları bulunamadı" },
        { status: 400 },
      );
    }

    const councilSession = await prisma.$transaction(async (tx) => {
      return tx.councilSession.create({
        data: {
          councilType,
          sessionDate: startOfToday(),
          createdByUserId: session.id,
          attendees: {
            create: attendeeUserIds.map((userId) => ({ userId })),
          },
        },
        select: { id: true },
      });
    });

    return NextResponse.json({ sessionId: councilSession.id }, { status: 201 });
  } catch (error) {
    console.error("Council roster error:", error);
    return NextResponse.json(
      { error: "Konsey yoklaması kaydedilemedi" },
      { status: 500 },
    );
  }
}
