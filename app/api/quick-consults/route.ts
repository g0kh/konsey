import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth-session";
import { BRANCHES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const body = (await request.json()) as {
      presentationId?: string;
      targetBranch?: string;
      question?: string;
      parentConsultId?: string;
    };

    const presentationId = body.presentationId?.trim();
    const targetBranch = body.targetBranch?.trim();
    const question = body.question?.trim();
    const parentConsultId = body.parentConsultId?.trim() || null;

    if (!presentationId || !targetBranch || !question) {
      return NextResponse.json(
        { error: "Tüm alanlar zorunludur" },
        { status: 400 },
      );
    }

    if (!BRANCHES.includes(targetBranch as (typeof BRANCHES)[number])) {
      return NextResponse.json({ error: "Geçersiz branş" }, { status: 400 });
    }

    const presentation = await prisma.councilPresentation.findUnique({
      where: { id: presentationId },
    });

    if (!presentation) {
      return NextResponse.json({ error: "Sunum bulunamadı" }, { status: 404 });
    }

    if (parentConsultId) {
      const parent = await prisma.quickConsult.findUnique({
        where: { id: parentConsultId },
      });

      if (!parent || parent.presentationId !== presentationId) {
        return NextResponse.json(
          { error: "Ana hızlı görüş bulunamadı" },
          { status: 404 },
        );
      }

      if (parent.requestedByUserId !== session.id) {
        return NextResponse.json(
          { error: "Yalnızca kendi görüş talebinize ekleme yapabilirsiniz" },
          { status: 403 },
        );
      }

      if (parent.parentConsultId) {
        return NextResponse.json(
          { error: "Ekleme yalnızca ana talebe yapılabilir" },
          { status: 400 },
        );
      }

      if (parent.targetBranch !== targetBranch) {
        return NextResponse.json(
          { error: "Ekleme aynı branşa yöneltilmelidir" },
          { status: 400 },
        );
      }
    }

    const consult = await prisma.quickConsult.create({
      data: {
        presentationId,
        requestedByUserId: session.id,
        targetBranch,
        question,
        parentConsultId,
      },
      include: {
        requestedBy: { select: { id: true, name: true, branch: true } },
        respondedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      id: consult.id,
      targetBranch: consult.targetBranch,
      question: consult.question,
      response: consult.response,
      respondedAt: consult.respondedAt?.toISOString() ?? null,
      createdAt: consult.createdAt.toISOString(),
      requestedBy: consult.requestedBy,
      respondedBy: consult.respondedBy,
    });
  } catch (error) {
    console.error("Quick consult create error:", error);
    return NextResponse.json(
      { error: "Hızlı görüş oluşturulamadı" },
      { status: 500 },
    );
  }
}
