import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const session = await prisma.councilSession.findUnique({
      where: { id },
      include: {
        presentations: { select: { presentationId: true } },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Oturum bulunamadı" },
        { status: 404 },
      );
    }

    const presentationIds = session.presentations.map((p) => p.presentationId);

    if (presentationIds.length === 0) {
      return NextResponse.json(
        { error: "Oturumda sunum bulunmuyor" },
        { status: 400 },
      );
    }

    await prisma.councilPresentation.updateMany({
      where: { id: { in: presentationIds } },
      data: { status: "IN_COUNCIL" },
    });

    return NextResponse.json({
      success: true,
      updatedCount: presentationIds.length,
    });
  } catch (error) {
    console.error("Council session start error:", error);
    return NextResponse.json(
      { error: "Oturum başlatılamadı" },
      { status: 500 },
    );
  }
}
