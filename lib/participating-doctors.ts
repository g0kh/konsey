type DoctorRef = {
  id: string;
  name: string;
  branch: string;
};

export function collectParticipatingDoctors(sources: {
  submittedBy?: DoctorRef | null;
  councilDecisionBy?: DoctorRef | null;
  branchComments?: { author: DoctorRef }[];
  quickConsults?: {
    requestedBy: DoctorRef;
    respondedBy?: { id: string; name: string } | null;
    targetBranch?: string;
  }[];
}): { name: string; branch: string }[] {
  const doctors = new Map<string, { name: string; branch: string }>();

  function add(user?: DoctorRef | null) {
    if (user?.id) {
      doctors.set(user.id, { name: user.name, branch: user.branch });
    }
  }

  add(sources.submittedBy);
  add(sources.councilDecisionBy);
  sources.branchComments?.forEach((comment) => add(comment.author));
  sources.quickConsults?.forEach((consult) => {
    add(consult.requestedBy);
    if (consult.respondedBy) {
      doctors.set(consult.respondedBy.id, {
        name: consult.respondedBy.name,
        branch: consult.targetBranch ?? "—",
      });
    }
  });

  return Array.from(doctors.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "tr"),
  );
}
