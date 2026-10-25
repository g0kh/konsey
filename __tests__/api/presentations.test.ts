/**
 * @jest-environment node
 */
import { GET as getPresentations, POST as postPresentation } from "@/app/api/presentations/route";
import {
  GET as getPresentationById,
  PATCH as patchPresentation,
} from "@/app/api/presentations/[id]/route";
import { callRoute, parseJson } from "../utils/apiClient";
import {
  createPatient,
  createPresentation,
  createUser,
  generateValidTcNo,
} from "../utils/factories";
import {
  disconnectTestDb,
  runMigrations,
  testPrisma,
  truncateAllTables,
} from "../utils/testDb";

beforeAll(async () => {
  await runMigrations();
});

beforeEach(async () => {
  await truncateAllTables();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("POST /api/presentations", () => {
  it("Geçerli veriyle yeni hasta + sunum oluşturulur", async () => {
    const user = await createUser();
    const tcNo = generateValidTcNo();

    const response = await callRoute(postPresentation, "/api/presentations", {
      method: "POST",
      body: {
        firstName: "Ayşe",
        lastName: "Yılmaz",
        tcNo,
        councilType: "Meme Konseyi",
        presentationReason: "İlk sunum",
        submittedByUserId: user.id,
      },
    });

    expect(response.status).toBe(200);
    const body = await parseJson<{ presentationId: string; patientId: string }>(
      response,
    );
    expect(body.presentationId).toBeTruthy();
    expect(body.patientId).toBeTruthy();
  });

  it("Aynı tcNo'lu hasta varsa upsert çalışır, yeni sunum oluşur", async () => {
    const user = await createUser();
    const tcNo = generateValidTcNo();
    await createPatient({ tcNo, firstName: "Eski" });

    const response = await callRoute(postPresentation, "/api/presentations", {
      method: "POST",
      body: {
        firstName: "Yeni",
        lastName: "İsim",
        tcNo,
        councilType: "Meme Konseyi",
        presentationReason: "İkinci sunum",
        submittedByUserId: user.id,
      },
    });

    expect(response.status).toBe(200);
    const presentations = await testPrisma.councilPresentation.findMany({
      where: { patient: { tcNo } },
    });
    expect(presentations).toHaveLength(1);
    const patient = await testPrisma.patient.findUnique({ where: { tcNo } });
    expect(patient?.firstName).toBe("Yeni");
  });

  it("Zorunlu alan eksik → 400", async () => {
    const response = await callRoute(postPresentation, "/api/presentations", {
      method: "POST",
      body: { firstName: "Test" },
    });
    expect(response.status).toBe(400);
    const body = await parseJson<{ error: string }>(response);
    expect(body.error).toBeTruthy();
  });

  it("Geçersiz tcNo formatı → 400", async () => {
    const user = await createUser();
    const response = await callRoute(postPresentation, "/api/presentations", {
      method: "POST",
      body: {
        firstName: "A",
        lastName: "B",
        tcNo: "123",
        councilType: "Meme Konseyi",
        presentationReason: "Test",
        submittedByUserId: user.id,
      },
    });
    expect(response.status).toBe(400);
  });

  it("councilType geçersiz değer → 400", async () => {
    const user = await createUser();
    const response = await callRoute(postPresentation, "/api/presentations", {
      method: "POST",
      body: {
        firstName: "A",
        lastName: "B",
        tcNo: generateValidTcNo(),
        councilType: "Geçersiz Konsey",
        presentationReason: "Test",
        submittedByUserId: user.id,
      },
    });
    expect(response.status).toBe(400);
  });

  it("submittedByUserId olmayan kullanıcı → 400", async () => {
    const response = await callRoute(postPresentation, "/api/presentations", {
      method: "POST",
      body: {
        firstName: "A",
        lastName: "B",
        tcNo: generateValidTcNo(),
        councilType: "Meme Konseyi",
        presentationReason: "Test",
        submittedByUserId: "missing-user-id",
      },
    });
    expect(response.status).toBe(400);
  });
});

describe("GET /api/presentations", () => {
  it("Tüm sunumlar listelenir", async () => {
    await createPresentation({ councilType: "Meme Konseyi" });
    const response = await callRoute(getPresentations, "/api/presentations");
    const body = await parseJson<unknown[]>(response);
    expect(response.status).toBe(200);
    expect(body.length).toBe(1);
  });

  it("?councilType=Meme Konseyi filtresi çalışır", async () => {
    await createPresentation({ councilType: "Meme Konseyi" });
    await createPresentation({ councilType: "GİS Konseyi" });
    const response = await callRoute(
      getPresentations,
      "/api/presentations?councilType=Meme+Konseyi",
    );
    const body = await parseJson<{ councilType: string }[]>(response);
    expect(body).toHaveLength(1);
    expect(body[0].councilType).toBe("Meme Konseyi");
  });

  it("?status=PENDING filtresi çalışır", async () => {
    await createPresentation({ status: "PENDING" });
    await createPresentation({ status: "COMPLETED" });
    const response = await callRoute(
      getPresentations,
      "/api/presentations?status=PENDING",
    );
    const body = await parseJson<{ status: string }[]>(response);
    expect(body.every((p) => p.status === "PENDING")).toBe(true);
  });

  it("?search=hasta adı filtresi çalışır", async () => {
    const patient = await createPatient({ firstName: "Zeynep", lastName: "Arslan" });
    await createPresentation({ patientId: patient.id });
    const response = await callRoute(
      getPresentations,
      "/api/presentations?search=Zeynep",
    );
    const body = await parseJson<unknown[]>(response);
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  it("?search=TC numarası filtresi çalışır", async () => {
    const tcNo = generateValidTcNo();
    const patient = await createPatient({ tcNo });
    await createPresentation({ patientId: patient.id });
    const response = await callRoute(
      getPresentations,
      `/api/presentations?search=${tcNo}`,
    );
    const body = await parseJson<unknown[]>(response);
    expect(body.length).toBe(1);
  });

  it("Birden fazla filtre kombine edilebilir", async () => {
    const patient = await createPatient({ firstName: "Kombine" });
    await createPresentation({
      patientId: patient.id,
      councilType: "Meme Konseyi",
      status: "PENDING",
    });
    const response = await callRoute(
      getPresentations,
      "/api/presentations?councilType=Meme+Konseyi&status=PENDING&search=Kombine",
    );
    const body = await parseJson<unknown[]>(response);
    expect(body).toHaveLength(1);
  });

  it("Boş liste → 200 + []", async () => {
    const response = await callRoute(getPresentations, "/api/presentations");
    const body = await parseJson<unknown[]>(response);
    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("Her item: patient, submittedBy içeriyor", async () => {
    await createPresentation();
    const response = await callRoute(getPresentations, "/api/presentations");
    const body = await parseJson<
      { patient: unknown; submittedBy: unknown }[]
    >(response);
    expect(body[0].patient).toBeDefined();
    expect(body[0].submittedBy).toBeDefined();
  });
});

describe("GET /api/presentations/[id]", () => {
  it("Var olan sunum → 200 + tam detay", async () => {
    const presentation = await createPresentation();
    const response = await callRoute(
      getPresentationById,
      `/api/presentations/${presentation.id}`,
      {},
      { id: presentation.id },
    );
    expect(response.status).toBe(200);
    const body = await parseJson<{
      patient: unknown;
      branchComments: unknown[];
      quickConsults: unknown[];
    }>(response);
    expect(body.patient).toBeDefined();
    expect(body.branchComments).toBeDefined();
    expect(body.quickConsults).toBeDefined();
  });

  it("Olmayan id → 404", async () => {
    const response = await callRoute(
      getPresentationById,
      "/api/presentations/missing",
      {},
      { id: "clxxxxxxxxxxxxxxxxxxxxxx" },
    );
    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/presentations/[id]", () => {
  it("Status PENDING → IN_COUNCIL güncelleme", async () => {
    const presentation = await createPresentation({ status: "PENDING" });
    const response = await callRoute(
      patchPresentation,
      `/api/presentations/${presentation.id}`,
      { method: "PATCH", body: { status: "IN_COUNCIL" } },
      { id: presentation.id },
    );
    expect(response.status).toBe(200);
    const body = await parseJson<{ status: string }>(response);
    expect(body.status).toBe("IN_COUNCIL");
  });

  it("Status IN_COUNCIL → COMPLETED (karar alanı dolu)", async () => {
    const user = await createUser();
    const presentation = await createPresentation({
      status: "IN_COUNCIL",
      submittedByUserId: user.id,
    });
    const response = await callRoute(
      patchPresentation,
      `/api/presentations/${presentation.id}`,
      {
        method: "PATCH",
        body: {
          status: "COMPLETED",
          councilDecision: "Karar metni",
          councilDecisionByUserId: user.id,
        },
      },
      { id: presentation.id },
    );
    expect(response.status).toBe(200);
    const body = await parseJson<{ status: string }>(response);
    expect(body.status).toBe("COMPLETED");
  });

  it("Karar alanı boşken COMPLETED → 400", async () => {
    const user = await createUser();
    const presentation = await createPresentation({
      status: "IN_COUNCIL",
      submittedByUserId: user.id,
    });
    const response = await callRoute(
      patchPresentation,
      `/api/presentations/${presentation.id}`,
      {
        method: "PATCH",
        body: {
          status: "COMPLETED",
          councilDecisionByUserId: user.id,
        },
      },
      { id: presentation.id },
    );
    expect(response.status).toBe(400);
  });

  it("councilDecision güncelleme", async () => {
    const presentation = await createPresentation();
    const response = await callRoute(
      patchPresentation,
      `/api/presentations/${presentation.id}`,
      {
        method: "PATCH",
        body: { councilDecision: "Güncel karar" },
      },
      { id: presentation.id },
    );
    expect(response.status).toBe(200);
  });

  it("Olmayan id → 404", async () => {
    const response = await callRoute(
      patchPresentation,
      "/api/presentations/missing",
      { method: "PATCH", body: { status: "IN_COUNCIL" } },
      { id: "clxxxxxxxxxxxxxxxxxxxxxx" },
    );
    expect(response.status).toBe(404);
  });
});
