import type {
  CouncilPresentation,
  Patient,
  QuickConsult,
  User,
  UserRole,
} from "@prisma/client";
import { BRANCHES, COUNCIL_TYPES } from "@/lib/constants";
import { testPrisma } from "./testDb";

let sequence = 0;

function nextId(): number {
  sequence += 1;
  return sequence;
}

export function generateValidTcNo(): string {
  let base = "";
  for (let i = 0; i < 9; i++) {
    base += Math.floor(Math.random() * 10).toString();
  }
  if (base[0] === "0") {
    base = `1${base.slice(1)}`;
  }

  const digits = base.split("").map(Number);
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
  const digit10 = (sumOdd * 7 - sumEven) % 10;
  const digit11 =
    (digits.reduce((acc, digit) => acc + digit, 0) + digit10) % 10;

  return `${base}${digit10}${digit11}`;
}

type UserOverrides = Partial<{
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  passwordHash: string;
  branch: string;
  role: UserRole;
}>;

export async function createUser(overrides: UserOverrides = {}): Promise<User> {
  const n = nextId();
  const firstName = overrides.firstName ?? "Test";
  const lastName = overrides.lastName ?? `Kullanıcı${n}`;
  return testPrisma.user.create({
    data: {
      firstName,
      lastName,
      name: overrides.name ?? `${firstName} ${lastName}`,
      username: overrides.username ?? `test.user${n}`,
      passwordHash: overrides.passwordHash ?? "test-hash",
      branch:
        overrides.branch ??
        BRANCHES[(n - 1) % BRANCHES.length],
      role: overrides.role ?? "DOCTOR",
    },
  });
}

type PatientOverrides = Partial<{
  firstName: string;
  lastName: string;
  tcNo: string;
  birthDate: Date | null;
  gender: string | null;
  diagnosis: string | null;
}>;

export async function createPatient(
  overrides: PatientOverrides = {},
): Promise<Patient> {
  const n = nextId();
  return testPrisma.patient.create({
    data: {
      firstName: overrides.firstName ?? `Hasta${n}`,
      lastName: overrides.lastName ?? `Soyad${n}`,
      tcNo: overrides.tcNo ?? generateValidTcNo(),
      birthDate: overrides.birthDate ?? new Date("1970-01-01"),
      gender: overrides.gender ?? "Kadın",
      diagnosis: overrides.diagnosis ?? `Tanı ${n}`,
    },
  });
}

type PresentationOverrides = Partial<{
  patientId: string;
  submittedByUserId: string;
  councilType: string;
  presentationReason: string;
  status: CouncilPresentation["status"];
  councilDecision: string | null;
  councilDate: Date | null;
}>;

export async function createPresentation(
  overrides: PresentationOverrides = {},
): Promise<CouncilPresentation> {
  const patient =
    overrides.patientId != null
      ? { id: overrides.patientId }
      : await createPatient();
  const submitter =
    overrides.submittedByUserId != null
      ? { id: overrides.submittedByUserId }
      : await createUser();

  const n = nextId();

  return testPrisma.councilPresentation.create({
    data: {
      patientId: patient.id,
      submittedByUserId: submitter.id,
      councilType:
        overrides.councilType ??
        COUNCIL_TYPES[(n - 1) % COUNCIL_TYPES.length],
      presentationReason:
        overrides.presentationReason ?? `Sunum sebebi ${n}`,
      status: overrides.status ?? "PENDING",
      councilDecision: overrides.councilDecision ?? null,
      councilDate: overrides.councilDate ?? null,
    },
  });
}

type QuickConsultOverrides = Partial<{
  presentationId: string;
  requestedByUserId: string;
  targetBranch: string;
  question: string;
  response: string | null;
  respondedByUserId: string | null;
  respondedAt: Date | null;
}>;

export async function createQuickConsult(
  overrides: QuickConsultOverrides = {},
): Promise<QuickConsult> {
  const presentation =
    overrides.presentationId != null
      ? { id: overrides.presentationId }
      : await createPresentation();
  const requester =
    overrides.requestedByUserId != null
      ? { id: overrides.requestedByUserId }
      : await createUser();

  return testPrisma.quickConsult.create({
    data: {
      presentationId: presentation.id,
      requestedByUserId: requester.id,
      targetBranch:
        overrides.targetBranch ?? "Radyoloji",
      question: overrides.question ?? "Test sorusu?",
      response: overrides.response ?? null,
      respondedByUserId: overrides.respondedByUserId ?? null,
      respondedAt: overrides.respondedAt ?? null,
    },
  });
}

type BranchCommentOverrides = Partial<{
  presentationId: string;
  authorUserId: string;
  branch: string;
  content: string;
}>;

export async function createBranchComment(
  overrides: BranchCommentOverrides = {},
) {
  const presentation =
    overrides.presentationId != null
      ? { id: overrides.presentationId }
      : await createPresentation();
  const author =
    overrides.authorUserId != null
      ? await testPrisma.user.findUniqueOrThrow({
          where: { id: overrides.authorUserId },
        })
      : await createUser({ branch: overrides.branch });

  return testPrisma.branchComment.create({
    data: {
      presentationId: presentation.id,
      authorUserId: author.id,
      branch: overrides.branch ?? author.branch,
      content: overrides.content ?? "Test yorumu",
    },
  });
}
