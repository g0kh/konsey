import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as {
      response?: string;
    };

    const response = body.response?.trim();

    if (!response) {
      return NextResponse.json({ error: "Yanıt zorunludur" }, { status: 400 });
    }

    const consult = await prisma.quickConsult.findUnique({
      where: { id },
    });

    if (!consult) {
      return NextResponse.json(
        { error: "Hızlı görüş bulunamadı" },
        { status: 404 },
      );
    }

    if (consult.response) {
      return NextResponse.json(
        { error: "Bu görüş zaten yanıtlanmış" },
        { status: 400 },
      );
    }

    if (session.branch !== consult.targetBranch) {
      return NextResponse.json(
        { error: "Yalnızca hedef branş yanıt verebilir" },
        { status: 403 },
      );
    }

    const updated = await prisma.quickConsult.update({
      where: { id },
      data: {
        response,
        respondedByUserId: session.id,
        respondedAt: new Date(),
      },
      include: {
        requestedBy: { select: { id: true, name: true, branch: true } },
        respondedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      id: updated.id,
      targetBranch: updated.targetBranch,
      question: updated.question,
      response: updated.response,
      respondedAt: updated.respondedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      requestedBy: updated.requestedBy,
      respondedBy: updated.respondedBy,
    });
  } catch (error) {
    console.error("Quick consult update error:", error);
    return NextResponse.json(
      { error: "Hızlı görüş güncellenemedi" },
      { status: 500 },
    );
  }
}
