import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_CONTENT_LENGTH = 4000;

export async function POST(request: Request) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    if (session.role === "READONLY") {
      return NextResponse.json(
        { error: "Ek görüş ekleme yetkiniz yok" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      presentationId?: string;
      content?: string;
    };

    const presentationId = body.presentationId?.trim();
    const content = body.content?.trim() ?? "";

    if (!presentationId || !content) {
      return NextResponse.json(
        { error: "Ek görüş metni zorunludur" },
        { status: 400 },
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: "Ek görüş en fazla 4000 karakter olabilir" },
        { status: 400 },
      );
    }

    const presentation = await prisma.councilPresentation.findUnique({
      where: { id: presentationId },
      select: { id: true, status: true },
    });

    if (!presentation) {
      return NextResponse.json({ error: "Sunum bulunamadı" }, { status: 404 });
    }

    if (presentation.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Ek görüş yalnız tamamlanmış konseylere eklenebilir" },
        { status: 400 },
      );
    }

    const opinion = await prisma.supplementaryOpinion.create({
      data: {
        presentationId,
        authorUserId: session.id,
        branch: session.branch,
        content,
      },
      include: {
        author: { select: { id: true, name: true, branch: true } },
      },
    });

    return NextResponse.json(
      {
        id: opinion.id,
        content: opinion.content,
        branch: opinion.branch,
        createdAt: opinion.createdAt.toISOString(),
        author: opinion.author,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Supplementary opinion error:", error);
    return NextResponse.json(
      { error: "Ek görüş kaydedilemedi" },
      { status: 500 },
    );
  }
}
