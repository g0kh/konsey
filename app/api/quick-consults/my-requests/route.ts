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

    const consults = await prisma.quickConsult.findMany({
      where: {
        requestedByUserId: session.id,
        parentConsultId: null,
      },
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
        followUps: {
          orderBy: { createdAt: "asc" },
          include: {
            requestedBy: { select: { id: true, name: true, branch: true } },
            respondedBy: { select: { id: true, name: true } },
          },
        },
        requestedBy: { select: { id: true, name: true, branch: true } },
        respondedBy: { select: { id: true, name: true } },
      },
    });

    const result = consults.map((consult) => ({
      id: consult.id,
      question: consult.question,
      targetBranch: consult.targetBranch,
      response: consult.response,
      respondedAt: consult.respondedAt?.toISOString() ?? null,
      createdAt: consult.createdAt.toISOString(),
      presentationId: consult.presentationId,
      councilType: consult.presentation.councilType,
      patient: consult.presentation.patient,
      requestedBy: consult.requestedBy,
      respondedBy: consult.respondedBy,
      followUps: consult.followUps.map((followUp) => ({
        id: followUp.id,
        question: followUp.question,
        targetBranch: followUp.targetBranch,
        response: followUp.response,
        respondedAt: followUp.respondedAt?.toISOString() ?? null,
        createdAt: followUp.createdAt.toISOString(),
        requestedBy: followUp.requestedBy,
        respondedBy: followUp.respondedBy,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("My quick consults fetch error:", error);
    return NextResponse.json(
      { error: "Hızlı görüşler yüklenemedi" },
      { status: 500 },
    );
  }
}
