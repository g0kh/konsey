export type CompletedPresentationItem = {
  id: string;
  councilType: string;
  councilDecision: string | null;
  councilDecisionAt: string | null;
  patient: {
    firstName: string;
    lastName: string;
    tcNoMasked: string;
  };
  councilDecisionBy: {
    id: string;
    name: string;
    branch: string;
  } | null;
  branchComments: {
    id: string;
    branch: string;
    content: string;
    createdAt: string;
    author: { id: string; name: string; branch: string };
  }[];
};

export type CompletedPresentationsResponse = {
  items: CompletedPresentationItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
