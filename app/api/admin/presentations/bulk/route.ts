import { PresentationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { logAdminAction, requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = (await request.json()) as { ids?: string[] };
    const ids = body.ids?.filter(Boolean) ?? [];

    if (!ids.length) {
      return NextResponse.json({ error: "Silinecek kayıt seçilmedi" }, { status: 400 });
    }

    const result = await prisma.councilPresentation.deleteMany({
      where: { id: { in: ids } },
    });

    await logAdminAction(
      auth.user.id,
      "bulk_delete",
      "CouncilPresentation",
      ids.join(","),
      `${result.count} sunum silindi`,
    );

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Admin bulk delete error:", error);
    return NextResponse.json({ error: "Toplu silme başarısız" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = (await request.json()) as {
      ids?: string[];
      status?: PresentationStatus;
    };

    const ids = body.ids?.filter(Boolean) ?? [];
    if (!ids.length || !body.status) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const result = await prisma.councilPresentation.updateMany({
      where: { id: { in: ids } },
      data: { status: body.status },
    });

    await logAdminAction(
      auth.user.id,
      "bulk_status_update",
      "CouncilPresentation",
      ids.join(","),
      `${result.count} sunum → ${body.status}`,
    );

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error("Admin bulk update error:", error);
    return NextResponse.json({ error: "Toplu güncelleme başarısız" }, { status: 500 });
  }
}
