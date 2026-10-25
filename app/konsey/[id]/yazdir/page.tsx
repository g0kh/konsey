import { notFound } from "next/navigation";
import { PresentationPrintView } from "@/components/konsey/presentation-print-view";
import { parseImagingNote } from "@/lib/imaging-utils";
import { prisma } from "@/lib/prisma";
import type { PresentationDetail } from "@/lib/types/presentation-detail";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function fetchPresentationForPrint(id: string): Promise<PresentationDetail | null> {
  const presentation = await prisma.councilPresentation.findUnique({
    where: { id },
    include: {
      patient: true,
      submittedBy: { select: { id: true, name: true, branch: true } },
      councilDecisionBy: { select: { id: true, name: true, branch: true } },
      quickConsults: {
        where: { parentConsultId: null },
        orderBy: { createdAt: "asc" },
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
    },
  });

  if (!presentation) {
    return null;
  }

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
    quickConsults: presentation.quickConsults.map((consult) => ({
      id: consult.id,
      targetBranch: consult.targetBranch,
      question: consult.question,
      response: consult.response,
      respondedAt: consult.respondedAt?.toISOString() ?? null,
      createdAt: consult.createdAt.toISOString(),
      parentConsultId: consult.parentConsultId,
      requestedBy: consult.requestedBy,
      respondedBy: consult.respondedBy,
      followUps: consult.followUps.map((followUp) => ({
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
    })),
    branchComments: presentation.branchComments.map((comment) => ({
      id: comment.id,
      branch: comment.branch,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: comment.author,
    })),
  };
}

export default async function PresentationPrintPage({ params }: PageProps) {
  const { id } = await params;
  const presentation = await fetchPresentationForPrint(id);

  if (!presentation) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-base">
      <PresentationPrintView presentation={presentation} />
    </div>
  );
}
