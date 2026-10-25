import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { toCsvRow } from "@/lib/admin-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",").filter(Boolean);

    const presentations = await prisma.councilPresentation.findMany({
      where: ids?.length ? { id: { in: ids } } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        patient: true,
        submittedBy: { select: { name: true, branch: true } },
      },
    });

    const header = toCsvRow([
      "Hasta Adı",
      "Hasta Soyadı",
      "TC",
      "Konsey Türü",
      "Durum",
      "Sunum Sebebi",
      "Sunan Doktor",
      "Konsey Tarihi",
      "Oluşturma",
    ]);

    const rows = presentations.map((p) =>
      toCsvRow([
        p.patient.firstName,
        p.patient.lastName,
        p.patient.tcNo,
        p.councilType,
        p.status,
        p.presentationReason,
        p.submittedBy.name,
        p.councilDate?.toISOString() ?? "",
        p.createdAt.toISOString(),
      ]),
    );

    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sunumlar-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Admin export error:", error);
    return NextResponse.json({ error: "Dışa aktarma başarısız" }, { status: 500 });
  }
}
