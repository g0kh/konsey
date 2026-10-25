import { PresentationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth-session";
import { parseImagingNote } from "@/lib/imaging-utils";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeQuickConsult(
  consult: {
    id: string;
    targetBranch: string;
    question: string;
    response: string | null;
    respondedAt: Date | null;
    createdAt: Date;
    parentConsultId: string | null;
    requestedBy: { id: string; name: string; branch: string };
    respondedBy: { id: string; name: string } | null;
    followUps?: Array<{
      id: string;
      targetBranch: string;
      question: string;
      response: string | null;
      respondedAt: Date | null;
      createdAt: Date;
      parentConsultId: string | null;
      requestedBy: { id: string; name: string; branch: string };
      respondedBy: { id: string; name: string } | null;
    }>;
  },
) {
  return {
    id: consult.id,
    targetBranch: consult.targetBranch,
    question: consult.question,
    response: consult.response,
    respondedAt: consult.respondedAt?.toISOString() ?? null,
    createdAt: consult.createdAt.toISOString(),
    parentConsultId: consult.parentConsultId,
    requestedBy: consult.requestedBy,
    respondedBy: consult.respondedBy,
    followUps: (consult.followUps ?? []).map((followUp) => ({
      id: followUp.id,
      targetBranch: followUp.targetBranch,
      question: followUp.question,
      response: followUp.response,
      respondedAt: followUp.respondedAt?.toISOString() ?? null,
      createdAt: followUp.createdAt.toISOString(),
      parentConsultId: followUp.parentConsultId,
      requestedBy: followUp.requestedBy,
      respondedBy: followUp.respondedBy,
      followUps: [],
    })),
  };
}

function serializePresentation(
  presentation: NonNullable<
    Awaited<ReturnType<typeof fetchPresentation>>
  >,
) {
  return {
    id: presentation.id,
    councilType: presentation.councilType,
    presentationReason: presentation.presentationReason,
    clinicalSummary: presentation.clinicalSummary,
    currentTreatment: presentation.currentTreatment,
    status: presentation.status,
    councilDate: presentation.councilDate?.toISOString() ?? null,
    councilDecision: presentation.councilDecision,
    councilDecisionAt: presentation.councilDecisionAt?.toISOString() ?? null,
    createdAt: presentation.createdAt.toISOString(),
    updatedAt: presentation.updatedAt.toISOString(),
    patient: {
      firstName: presentation.patient.firstName,
      lastName: presentation.patient.lastName,
      tcNo: presentation.patient.tcNo,
      birthDate: presentation.patient.birthDate?.toISOString() ?? null,
      gender: presentation.patient.gender,
      diagnosis: presentation.patient.diagnosis,
    },
    submittedBy: presentation.submittedBy,
    councilDecisionBy: presentation.councilDecisionBy,
    imaging: {
      pet: parseImagingNote(presentation.petScanNote),
      mr: parseImagingNote(presentation.mrNote),
      ct: parseImagingNote(presentation.ctNote),
      pathology: parseImagingNote(presentation.pathologyNote),
      memeUsg: parseImagingNote(presentation.memeUsgNote),
      other: parseImagingNote(presentation.imagingNote),
    },
    quickConsults: presentation.quickConsults
      .filter((consult) => !consult.parentConsultId)
      .map((consult) => serializeQuickConsult(consult)),
    branchComments: presentation.branchComments.map((comment) => ({
      id: comment.id,
      branch: comment.branch,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: comment.author,
    })),
    supplementaryOpinions: presentation.supplementaryOpinions.map((opinion) => ({
      id: opinion.id,
      content: opinion.content,
      branch: opinion.branch,
      createdAt: opinion.createdAt.toISOString(),
      author: opinion.author,
    })),
  };
}

async function fetchPresentation(id: string) {
  return prisma.councilPresentation.findUnique({
    where: { id },
    include: {
      patient: true,
      submittedBy: { select: { id: true, name: true, branch: true } },
      councilDecisionBy: { select: { id: true, name: true, branch: true } },
      quickConsults: {
        where: { parentConsultId: null },
        orderBy: { createdAt: "desc" },
        include: {
          requestedBy: { select: { id: true, name: true, branch: true } },
          respondedBy: { select: { id: true, name: true } },
          followUps: {
            orderBy: { createdAt: "asc" },
            include: {
              requestedBy: { select: { id: true, name: true, branch: true } },
              respondedBy: { select: { id: true, name: true } },
            },
          },
        },
      },
      branchComments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, branch: true } },
        },
      },
      supplementaryOpinions: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, branch: true } },
        },
      },
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const presentation = await fetchPresentation(id);

    if (!presentation) {
      return NextResponse.json({ error: "Sunum bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(serializePresentation(presentation));
  } catch (error) {
    console.error("Presentation fetch error:", error);
    return NextResponse.json(
      { error: "Sunum yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: PresentationStatus;
      councilDecision?: string;
      sessionId?: string;
      orderIndex?: number;
    };

    const existing = await prisma.councilPresentation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Sunum bulunamadı" }, { status: 404 });
    }

    const data: {
      status?: PresentationStatus;
      councilDecision?: string | null;
      councilDecisionByUserId?: string;
      councilDecisionAt?: Date;
    } = {};

    if (body.status) {
      const validStatuses: PresentationStatus[] = [
        "PENDING",
        "IN_COUNCIL",
        "COMPLETED",
        "CANCELLED",
      ];

      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
      }

      data.status = body.status;
    }

    if (body.councilDecision !== undefined) {
      data.councilDecision = body.councilDecision.trim() || null;
    }

    if (body.status === "COMPLETED" || data.status === "COMPLETED") {
      const decision =
        body.councilDecision?.trim() ?? existing.councilDecision?.trim();

      if (!decision) {
        return NextResponse.json(
          { error: "Konsey kararı zorunludur" },
          { status: 400 },
        );
      }

      data.status = "COMPLETED";
      data.councilDecision = decision;
      data.councilDecisionByUserId = session.id;
      data.councilDecisionAt = new Date();
    }

    await prisma.$transaction(async (tx) => {
      await tx.councilPresentation.update({
        where: { id },
        data,
      });

      if (data.status !== "COMPLETED" || !body.sessionId) {
        return;
      }

      const councilSession = await tx.councilSession.findUnique({
        where: { id: body.sessionId },
        include: {
          attendees: {
            include: {
              user: { select: { id: true, name: true, branch: true } },
            },
          },
        },
      });

      if (!councilSession || councilSession.councilType !== existing.councilType) {
        throw new Error("Oturum bu konseye ait değil");
      }

      await tx.councilSessionPresentation.upsert({
        where: {
          sessionId_presentationId: {
            sessionId: councilSession.id,
            presentationId: id,
          },
        },
        create: {
          sessionId: councilSession.id,
          presentationId: id,
          orderIndex: body.orderIndex ?? 0,
        },
        update: {
          orderIndex: body.orderIndex ?? 0,
        },
      });

      await tx.presentationAttendee.deleteMany({
        where: { presentationId: id },
      });

      if (councilSession.attendees.length > 0) {
        await tx.presentationAttendee.createMany({
          data: councilSession.attendees.map((attendee) => ({
            presentationId: id,
            userId: attendee.userId,
            nameSnapshot: attendee.user.name,
            branchSnapshot: attendee.user.branch,
          })),
        });
      }
    });

    const updated = await fetchPresentation(id);
    return NextResponse.json(serializePresentation(updated!));
  } catch (error) {
    if (error instanceof Error && error.message === "Oturum bu konseye ait değil") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Presentation update error:", error);
    return NextResponse.json(
      { error: "Sunum güncellenemedi" },
      { status: 500 },
    );
  }
}
