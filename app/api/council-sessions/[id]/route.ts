import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const session = await prisma.councilSession.findUnique({
      where: { id },
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
                submittedBy: { select: { name: true, branch: true } },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Oturum bulunamadı" },
        { status: 404 },
      );
    }

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
    console.error("Council session fetch error:", error);
    return NextResponse.json(
      { error: "Oturum yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      sessionDate?: string;
      notes?: string;
      presentationIds?: string[];
    };

    const session = await prisma.councilSession.findUnique({ where: { id } });

    if (!session) {
      return NextResponse.json(
        { error: "Oturum bulunamadı" },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      if (body.presentationIds) {
        await tx.councilSessionPresentation.deleteMany({
          where: { sessionId: id },
        });

        if (body.presentationIds.length > 0) {
          await tx.councilSessionPresentation.createMany({
            data: body.presentationIds.map((presentationId, index) => ({
              sessionId: id,
              presentationId,
              orderIndex: index + 1,
            })),
          });
        }
      }

      await tx.councilSession.update({
        where: { id },
        data: {
          sessionDate: body.sessionDate
            ? new Date(body.sessionDate)
            : undefined,
          notes:
            body.notes !== undefined ? body.notes.trim() || null : undefined,
        },
      });
    });

    const updated = await prisma.councilSession.findUnique({
      where: { id },
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Council session update error:", error);
    return NextResponse.json(
      { error: "Oturum güncellenemedi" },
      { status: 500 },
    );
  }
}
