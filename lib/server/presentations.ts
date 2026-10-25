import { PresentationStatus, Prisma } from "@prisma/client";
import { COUNCIL_TYPES } from "@/lib/constants";
import { imagingHasContent } from "@/lib/imaging-utils";
import { prisma } from "@/lib/prisma";

export type PresentationListItem = {
  id: string;
  councilType: string;
  presentationReason: string;
  status: PresentationStatus;
  councilDate: string | null;
  councilDecisionAt: string | null;
  createdAt: string;
  patient: {
    firstName: string;
    lastName: string;
    tcNo: string;
  };
  submittedBy: {
    name: string;
    branch: string;
  };
  hasPendingConsultForBranch: boolean;
  imagingLabels: string[];
};

const VALID_STATUSES: PresentationStatus[] = [
  "PENDING",
  "IN_COUNCIL",
  "COMPLETED",
];

export type PresentationListFilters = {
  councilType?: string | null;
  status?: string | null;
  search?: string | null;
  userBranch?: string | null;
  preferredCouncilTypes?: string[] | null;
};

export async function getPresentationsList(
  filters: PresentationListFilters = {},
): Promise<PresentationListItem[]> {
  const councilType = filters.councilType;
  const status = filters.status;
  const search = filters.search?.trim();
  const userBranch = filters.userBranch?.trim();
  const preferredCouncilTypes = filters.preferredCouncilTypes?.filter(Boolean);

  const where: Prisma.CouncilPresentationWhereInput = {
    status: { not: "CANCELLED" },
  };

  if (preferredCouncilTypes) {
    if (preferredCouncilTypes.length === 0) {
      return [];
    }
    where.councilType = { in: preferredCouncilTypes };
  }

  if (councilType && councilType !== "all") {
    if (!COUNCIL_TYPES.includes(councilType as (typeof COUNCIL_TYPES)[number])) {
      return [];
    }
    if (
      preferredCouncilTypes &&
      !preferredCouncilTypes.includes(councilType)
    ) {
      return [];
    }
    where.councilType = councilType;
  }

  if (status && VALID_STATUSES.includes(status as PresentationStatus)) {
    where.status = status as PresentationStatus;
  }

  if (search) {
    where.OR = [
      { patient: { firstName: { contains: search, mode: "insensitive" } } },
      { patient: { lastName: { contains: search, mode: "insensitive" } } },
      { patient: { tcNo: { contains: search } } },
    ];
  }

  const presentations = await prisma.councilPresentation.findMany({
    where,
    orderBy: [{ councilType: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      councilType: true,
      presentationReason: true,
      status: true,
      councilDate: true,
      councilDecisionAt: true,
      createdAt: true,
      petScanNote: true,
      mrNote: true,
      ctNote: true,
      pathologyNote: true,
      memeUsgNote: true,
      imagingNote: true,
      patient: {
        select: {
          firstName: true,
          lastName: true,
          tcNo: true,
        },
      },
      submittedBy: {
        select: {
          name: true,
          branch: true,
        },
      },
      quickConsults: userBranch
        ? {
            where: {
              targetBranch: userBranch,
              response: null,
            },
            select: { id: true },
          }
        : false,
    },
  });

  return presentations.map((presentation) => {
    const imagingLabels: string[] = [];
    if (imagingHasContent(presentation.petScanNote)) imagingLabels.push("PET");
    if (imagingHasContent(presentation.mrNote)) imagingLabels.push("MR");
    if (imagingHasContent(presentation.ctNote)) imagingLabels.push("BT");
    if (imagingHasContent(presentation.pathologyNote)) imagingLabels.push("Patoloji");
    if (imagingHasContent(presentation.memeUsgNote)) imagingLabels.push("Ultrason");
    if (imagingHasContent(presentation.imagingNote)) imagingLabels.push("Diğer");

    return {
      id: presentation.id,
      councilType: presentation.councilType,
      presentationReason: presentation.presentationReason,
      status: presentation.status,
      councilDate: presentation.councilDate?.toISOString() ?? null,
      councilDecisionAt: presentation.councilDecisionAt?.toISOString() ?? null,
      createdAt: presentation.createdAt.toISOString(),
      patient: presentation.patient,
      submittedBy: presentation.submittedBy,
      hasPendingConsultForBranch: userBranch
        ? (presentation.quickConsults?.length ?? 0) > 0
        : false,
      imagingLabels,
    };
  });
}
