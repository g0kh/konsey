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
      content?: string;
    };

    const presentationId = body.presentationId?.trim();
    const content = body.content?.trim();
    const branch = session.branch;

    if (!presentationId || !content) {
      return NextResponse.json(
        { error: "Tüm alanlar zorunludur" },
        { status: 400 },
      );
    }

    if (!BRANCHES.includes(branch as (typeof BRANCHES)[number])) {
      return NextResponse.json({ error: "Geçersiz branş" }, { status: 400 });
    }

    const presentation = await prisma.councilPresentation.findUnique({
      where: { id: presentationId },
    });

    if (!presentation) {
      return NextResponse.json({ error: "Sunum bulunamadı" }, { status: 404 });
    }

    const existing = await prisma.branchComment.findFirst({
      where: { presentationId, branch },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu branş için zaten yorum var" },
        { status: 400 },
      );
    }

    const comment = await prisma.branchComment.create({
      data: {
        presentationId,
        authorUserId: session.id,
        branch,
        content,
      },
      include: {
        author: { select: { id: true, name: true, branch: true } },
      },
    });

    return NextResponse.json({
      id: comment.id,
      branch: comment.branch,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: comment.author,
    });
  } catch (error) {
    console.error("Branch comment create error:", error);
    return NextResponse.json(
      { error: "Branş yorumu oluşturulamadı" },
      { status: 500 },
    );
  }
}
