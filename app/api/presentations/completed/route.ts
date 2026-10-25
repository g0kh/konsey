import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { COUNCIL_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { maskTcNo } from "@/lib/tc-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const councilType = searchParams.get("councilType");
    const search = searchParams.get("search")?.trim();
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      50,
      Math.max(1, Number(searchParams.get("pageSize") ?? "20")),
    );

    const where: Prisma.CouncilPresentationWhereInput = {
      status: "COMPLETED",
    };

    if (councilType && councilType !== "all") {
      if (!COUNCIL_TYPES.includes(councilType as (typeof COUNCIL_TYPES)[number])) {
        return NextResponse.json(
          { error: "Geçersiz konsey türü" },
          { status: 400 },
        );
      }
      where.councilType = councilType;
    }

    if (search) {
      where.OR = [
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (startDate || endDate) {
      where.councilDecisionAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.councilDecisionAt.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.councilDecisionAt.lte = end;
      }
    }

    const [total, presentations] = await Promise.all([
      prisma.councilPresentation.count({ where }),
      prisma.councilPresentation.findMany({
        where,
        orderBy: { councilDecisionAt: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              tcNo: true,
            },
          },
          councilDecisionBy: {
            select: { id: true, name: true, branch: true },
          },
          branchComments: {
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, name: true, branch: true } },
            },
          },
        },
      }),
    ]);

    const items = presentations.map((presentation) => ({
      id: presentation.id,
      councilType: presentation.councilType,
      councilDecision: presentation.councilDecision,
      councilDecisionAt: presentation.councilDecisionAt?.toISOString() ?? null,
      patient: {
        firstName: presentation.patient.firstName,
        lastName: presentation.patient.lastName,
        tcNoMasked: maskTcNo(presentation.patient.tcNo),
      },
      councilDecisionBy: presentation.councilDecisionBy,
      branchComments: presentation.branchComments.map((comment) => ({
        id: comment.id,
        branch: comment.branch,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        author: comment.author,
      })),
    }));

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Completed presentations fetch error:", error);
    return NextResponse.json(
      { error: "Arşiv yüklenemedi" },
      { status: 500 },
    );
  }
}
