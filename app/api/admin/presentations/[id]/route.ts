import { PresentationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { logAdminAction, requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: PresentationStatus;
      councilDate?: string | null;
      councilDecision?: string | null;
      adminNotes?: string | null;
    };

    const existing = await prisma.councilPresentation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Sunum bulunamadı" }, { status: 404 });
    }

    const data: {
      status?: PresentationStatus;
      councilDate?: Date | null;
      councilDecision?: string | null;
      adminNotes?: string | null;
      councilDecisionAt?: Date;
      councilDecisionByUserId?: string;
    } = {};

    if (body.status) {
      data.status = body.status;
    }
    if (body.councilDate !== undefined) {
      data.councilDate = body.councilDate ? new Date(body.councilDate) : null;
    }
    if (body.councilDecision !== undefined) {
      data.councilDecision = body.councilDecision?.trim() || null;
      if (body.councilDecision?.trim()) {
        data.councilDecisionAt = new Date();
        data.councilDecisionByUserId = auth.user.id;
        await logAdminAction(
          auth.user.id,
          "decision_edit",
          "CouncilPresentation",
          id,
          `Karar güncellendi: ${body.councilDecision.slice(0, 100)}`,
        );
      }
    }
    if (body.adminNotes !== undefined) {
      data.adminNotes = body.adminNotes?.trim() || null;
    }

    const updated = await prisma.councilPresentation.update({
      where: { id },
      data,
    });

    await logAdminAction(
      auth.user.id,
      "presentation_update",
      "CouncilPresentation",
      id,
      `Durum: ${updated.status}`,
    );

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      councilDate: updated.councilDate?.toISOString() ?? null,
      councilDecision: updated.councilDecision,
      adminNotes: updated.adminNotes,
    });
  } catch (error) {
    console.error("Admin presentation update error:", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const { id } = await context.params;
    const existing = await prisma.councilPresentation.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Sunum bulunamadı" }, { status: 404 });
    }

    await prisma.councilPresentation.delete({ where: { id } });

    await logAdminAction(
      auth.user.id,
      "presentation_delete",
      "CouncilPresentation",
      id,
      `${existing.patient.firstName} ${existing.patient.lastName} sunumu silindi`,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin presentation delete error:", error);
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
