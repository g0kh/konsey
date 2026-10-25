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
      content?: string;
    };

    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "İçerik zorunludur" }, { status: 400 });
    }

    const comment = await prisma.branchComment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json({ error: "Yorum bulunamadı" }, { status: 404 });
    }

    if (comment.authorUserId !== session.id) {
      return NextResponse.json(
        { error: "Yalnızca kendi yorumunuzu düzenleyebilirsiniz" },
        { status: 403 },
      );
    }

    const updated = await prisma.branchComment.update({
      where: { id },
      data: { content },
      include: {
        author: { select: { id: true, name: true, branch: true } },
      },
    });

    return NextResponse.json({
      id: updated.id,
      branch: updated.branch,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      author: updated.author,
    });
  } catch (error) {
    console.error("Branch comment update error:", error);
    return NextResponse.json(
      { error: "Branş yorumu güncellenemedi" },
      { status: 500 },
    );
  }
}
