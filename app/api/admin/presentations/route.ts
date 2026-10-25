import { PresentationStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { maskTcNo } from "@/lib/admin-utils";
import { COUNCIL_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(
      100,
      Math.max(10, Number(searchParams.get("pageSize") ?? 25)),
    );
    const councilType = searchParams.get("councilType");
    const statuses = searchParams.get("statuses")?.split(",").filter(Boolean);
    const search = searchParams.get("search")?.trim();
    const submitter = searchParams.get("submitter")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Prisma.CouncilPresentationWhereInput = {};

    if (councilType && councilType !== "all") {
      where.councilType = councilType;
    }

    if (statuses?.length) {
      where.status = { in: statuses as PresentationStatus[] };
    }

    if (search) {
      where.OR = [
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
        { patient: { tcNo: { contains: search } } },
      ];
    }

    if (submitter) {
      where.submittedBy = {
        name: { contains: submitter, mode: "insensitive" },
      };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(`${dateTo}T23:59:59`);
      }
    }

    const [total, items] = await Promise.all([
      prisma.councilPresentation.count({ where }),
      prisma.councilPresentation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          patient: {
            select: { firstName: true, lastName: true, tcNo: true },
          },
          submittedBy: { select: { name: true, branch: true } },
        },
      }),
    ]);

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        patientName: `${item.patient.firstName} ${item.patient.lastName}`,
        tcNo: item.patient.tcNo,
        tcNoMasked: maskTcNo(item.patient.tcNo),
        councilType: item.councilType,
        presentationReason: item.presentationReason,
        submittedBy: item.submittedBy.name,
        status: item.status,
        councilDate: item.councilDate?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        councilDecision: item.councilDecision,
        adminNotes: item.adminNotes,
      })),
      total,
      page,
      pageSize,
      councilTypes: COUNCIL_TYPES,
    });
  } catch (error) {
    console.error("Admin presentations list error:", error);
    return NextResponse.json({ error: "Sunumlar yüklenemedi" }, { status: 500 });
  }
}
