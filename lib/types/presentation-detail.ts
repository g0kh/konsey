import type { PresentationStatus, UserRole } from "@prisma/client";
import type { ImagingEntry } from "@/lib/imaging-data";

export type ImagingDisplay = {
  notes: string;
  link: string | null;
  entries: ImagingEntry[];
};

export type PresentationDetail = {
  id: string;
  councilType: string;
  presentationReason: string;
  clinicalSummary: string | null;
  currentTreatment: string | null;
  status: PresentationStatus;
  councilDate: string | null;
  councilDecision: string | null;
  councilDecisionAt: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    firstName: string;
    lastName: string;
    tcNo: string;
    birthDate: string | null;
    gender: string | null;
    diagnosis: string | null;
  };
  submittedBy: {
    id: string;
    name: string;
    branch: string;
  };
  councilDecisionBy: {
    id: string;
    name: string;
    branch: string;
  } | null;
  imaging: {
    pet: ImagingDisplay;
    mr: ImagingDisplay;
    ct: ImagingDisplay;
    pathology: ImagingDisplay;
    memeUsg: ImagingDisplay;
    other: ImagingDisplay;
  };
  quickConsults: QuickConsultItem[];
  branchComments: BranchCommentItem[];
  attendees?: PresentationAttendeeItem[];
  supplementaryOpinions?: SupplementaryOpinionItem[];
};

export type SupplementaryOpinionItem = {
  id: string;
  content: string;
  branch: string;
  createdAt: string;
  author: { id: string; name: string; branch: string };
};

export type PresentationAttendeeItem = {
  id: string;
  name: string;
  branch: string;
};

export type QuickConsultItem = {
  id: string;
  targetBranch: string;
  question: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  parentConsultId: string | null;
  requestedBy: { id: string; name: string; branch: string };
  respondedBy: { id: string; name: string } | null;
  followUps: QuickConsultItem[];
};

export type BranchCommentItem = {
  id: string;
  branch: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; branch: string };
};

export type CurrentUserPayload = {
  id: string;
  role: UserRole;
};
