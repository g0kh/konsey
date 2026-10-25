import { NextResponse } from "next/server";
import { COUNCIL_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const councilType = searchParams.get("councilType")?.trim();
    const upcoming = searchParams.get("upcoming") === "true";

    const where: {
      councilType?: string;
      sessionDate?: { gte: Date };
    } = {};

    if (councilType) {
      if (!COUNCIL_TYPES.includes(councilType as (typeof COUNCIL_TYPES)[number])) {
        return NextResponse.json(
          { error: "Geçersiz konsey türü" },
          { status: 400 },
        );
      }
      where.councilType = councilType;
    }

    if (upcoming) {
      where.sessionDate = { gte: new Date() };
    }

    const sessions = await prisma.councilSession.findMany({
      where,
      orderBy: { sessionDate: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, branch: true } },
        presentations: {
          orderBy: { orderIndex: "asc" },
          include: {
            presentation: {
              include: {
                patient: {
                  select: {
                    firstName: true,
                    lastName: true,
                    tcNo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      sessions.map((session) => ({
        id: session.id,
        councilType: session.councilType,
        sessionDate: session.sessionDate.toISOString(),
        notes: session.notes,
        createdAt: session.createdAt.toISOString(),
        createdBy: session.createdBy,
        presentations: session.presentations.map((link) => ({
          orderIndex: link.orderIndex,
          presentation: {
            id: link.presentation.id,
            status: link.presentation.status,
            presentationReason: link.presentation.presentationReason,
            patient: link.presentation.patient,
          },
        })),
      })),
    );
  } catch (error) {
    console.error("Council sessions fetch error:", error);
    return NextResponse.json(
      { error: "Konsey oturumları yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      councilType?: string;
      sessionDate?: string;
      createdByUserId?: string;
      notes?: string;
      presentationIds?: string[];
    };

    const councilType = body.councilType?.trim();
    const sessionDate = body.sessionDate;
    const createdByUserId = body.createdByUserId?.trim();
    const presentationIds = body.presentationIds ?? [];

    if (!councilType || !sessionDate || !createdByUserId) {
      return NextResponse.json(
        { error: "Konsey türü, tarih ve oluşturan kullanıcı zorunludur" },
        { status: 400 },
      );
    }

    if (!COUNCIL_TYPES.includes(councilType as (typeof COUNCIL_TYPES)[number])) {
      return NextResponse.json({ error: "Geçersiz konsey türü" }, { status: 400 });
    }

    const creator = await prisma.user.findUnique({
      where: { id: createdByUserId },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Oluşturan kullanıcı bulunamadı" },
        { status: 400 },
      );
    }

    const session = await prisma.councilSession.create({
      data: {
        councilType,
        sessionDate: new Date(sessionDate),
        createdByUserId,
        notes: body.notes?.trim() || null,
        presentations: {
          create: presentationIds.map((presentationId, index) => ({
            presentationId,
            orderIndex: index + 1,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, branch: true } },
        presentations: {
          orderBy: { orderIndex: "asc" },
          include: {
            presentation: {
              include: {
                patient: {
                  select: { firstName: true, lastName: true, tcNo: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      id: session.id,
      councilType: session.councilType,
      sessionDate: session.sessionDate.toISOString(),
      notes: session.notes,
      createdBy: session.createdBy,
      presentations: session.presentations.map((link) => ({
        orderIndex: link.orderIndex,
        presentation: link.presentation,
      })),
    });
  } catch (error) {
    console.error("Council session create error:", error);
    return NextResponse.json(
      { error: "Konsey oturumu oluşturulamadı" },
      { status: 500 },
    );
  }
}
