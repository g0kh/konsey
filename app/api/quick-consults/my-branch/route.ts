import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getSessionUserFromRequest } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const answeredParam = searchParams.get("answered");

    const where: {
      targetBranch: string;
      response?: null | { not: null };
      presentation?: { councilType: { in: string[] } };
    } = { targetBranch: session.branch };

    if (answeredParam === "true") {
      where.response = { not: null };
    } else {
      where.response = null;
    }

    if (session.role !== "ADMIN") {
      where.presentation = {
        councilType: { in: session.preferredCouncilTypes },
      };
    }

    const consults = await prisma.quickConsult.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        presentation: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                tcNo: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            name: true,
            branch: true,
          },
        },
      },
    });

    const result = consults.map((consult) => ({
      id: consult.id,
      question: consult.question,
      targetBranch: consult.targetBranch,
      createdAt: consult.createdAt.toISOString(),
      presentationId: consult.presentationId,
      patient: consult.presentation.patient,
      councilType: consult.presentation.councilType,
      requestedBy: consult.requestedBy,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Quick consults fetch error:", error);
    return NextResponse.json(
      { error: "Hızlı görüşler yüklenemedi" },
      { status: 500 },
    );
  }
}
