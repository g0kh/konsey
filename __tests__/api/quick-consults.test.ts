/**
 * @jest-environment node
 */
import { POST as postQuickConsult } from "@/app/api/quick-consults/route";
import { PATCH as patchQuickConsult } from "@/app/api/quick-consults/[id]/route";
import { GET as getMyBranchConsults } from "@/app/api/quick-consults/my-branch/route";
import { callRoute, parseJson } from "../utils/apiClient";
import {
  createPresentation,
  createQuickConsult,
  createUser,
} from "../utils/factories";
import {
  disconnectTestDb,
  runMigrations,
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

describe("POST /api/quick-consults", () => {
  it("Geçerli veriyle oluşturma → 200", async () => {
    const user = await createUser();
    const presentation = await createPresentation({ submittedByUserId: user.id });

    const response = await callRoute(postQuickConsult, "/api/quick-consults", {
      method: "POST",
      body: {
        presentationId: presentation.id,
        requestedByUserId: user.id,
        targetBranch: "Radyoloji",
        question: "PET sonucu?",
      },
    });

    expect(response.status).toBe(200);
    const body = await parseJson<{ id: string }>(response);
    expect(body.id).toBeTruthy();
  });

  it("presentationId olmayan → 404", async () => {
    const user = await createUser();
    const response = await callRoute(postQuickConsult, "/api/quick-consults", {
      method: "POST",
      body: {
        presentationId: "missing",
        requestedByUserId: user.id,
        targetBranch: "Radyoloji",
        question: "Soru?",
      },
    });
    expect(response.status).toBe(404);
  });

  it("targetBranch geçersiz → 400", async () => {
    const user = await createUser();
    const presentation = await createPresentation({ submittedByUserId: user.id });
    const response = await callRoute(postQuickConsult, "/api/quick-consults", {
      method: "POST",
      body: {
        presentationId: presentation.id,
        requestedByUserId: user.id,
        targetBranch: "Geçersiz Branş",
        question: "Soru?",
      },
    });
    expect(response.status).toBe(400);
  });

  it("question boş → 400", async () => {
    const user = await createUser();
    const presentation = await createPresentation({ submittedByUserId: user.id });
    const response = await callRoute(postQuickConsult, "/api/quick-consults", {
      method: "POST",
      body: {
        presentationId: presentation.id,
        requestedByUserId: user.id,
        targetBranch: "Radyoloji",
        question: "   ",
      },
    });
    expect(response.status).toBe(400);
  });
});

describe("PATCH /api/quick-consults/[id]", () => {
  it("Yanıt ekleme → respondedAt otomatik set olur", async () => {
    const responder = await createUser({ branch: "Radyoloji" });
    const consult = await createQuickConsult({ targetBranch: "Radyoloji" });

    const response = await callRoute(
      patchQuickConsult,
      `/api/quick-consults/${consult.id}`,
      {
        method: "PATCH",
        body: {
          response: "Yanıt metni",
          respondedByUserId: responder.id,
        },
      },
      { id: consult.id },
    );

    expect(response.status).toBe(200);
    const body = await parseJson<{ respondedAt: string | null }>(response);
    expect(body.respondedAt).toBeTruthy();
  });

  it("Yanıt boş string → 400", async () => {
    const responder = await createUser({ branch: "Radyoloji" });
    const consult = await createQuickConsult({ targetBranch: "Radyoloji" });
    const response = await callRoute(
      patchQuickConsult,
      `/api/quick-consults/${consult.id}`,
      {
        method: "PATCH",
        body: { response: "  ", respondedByUserId: responder.id },
      },
      { id: consult.id },
    );
    expect(response.status).toBe(400);
  });

  it("respondedByUserId olmayan kullanıcı → 400", async () => {
    const consult = await createQuickConsult({ targetBranch: "Radyoloji" });
    const response = await callRoute(
      patchQuickConsult,
      `/api/quick-consults/${consult.id}`,
      {
        method: "PATCH",
        body: { response: "Yanıt", respondedByUserId: "missing" },
      },
      { id: consult.id },
    );
    expect(response.status).toBe(400);
  });

  it("Zaten yanıtlanmış konsülte yeniden yanıt → 400", async () => {
    const responder = await createUser({ branch: "Radyoloji" });
    const consult = await createQuickConsult({
      targetBranch: "Radyoloji",
      response: "İlk yanıt",
      respondedByUserId: responder.id,
      respondedAt: new Date(),
    });

    const response = await callRoute(
      patchQuickConsult,
      `/api/quick-consults/${consult.id}`,
      {
        method: "PATCH",
        body: { response: "İkinci yanıt", respondedByUserId: responder.id },
      },
      { id: consult.id },
    );
    expect(response.status).toBe(400);
  });
});

describe("GET /api/quick-consults/my-branch", () => {
  it("?branch=Radyoloji → sadece Radyoloji hedefli döner", async () => {
    await createQuickConsult({ targetBranch: "Radyoloji" });
    await createQuickConsult({ targetBranch: "Patoloji" });

    const response = await callRoute(
      getMyBranchConsults,
      "/api/quick-consults/my-branch?branch=Radyoloji",
    );
    const body = await parseJson<{ targetBranch: string }[]>(response);
    expect(body).toHaveLength(1);
    expect(body[0].targetBranch).toBe("Radyoloji");
  });

  it("?answered=false → sadece yanıtsızlar", async () => {
    const responder = await createUser({ branch: "Radyoloji" });
    await createQuickConsult({ targetBranch: "Radyoloji" });
    await createQuickConsult({
      targetBranch: "Radyoloji",
      response: "Yanıt",
      respondedByUserId: responder.id,
      respondedAt: new Date(),
    });

    const response = await callRoute(
      getMyBranchConsults,
      "/api/quick-consults/my-branch?branch=Radyoloji&answered=false",
    );
    const body = await parseJson<unknown[]>(response);
    expect(body).toHaveLength(1);
  });

  it("?answered=true → sadece yanıtlılar", async () => {
    const responder = await createUser({ branch: "Radyoloji" });
    await createQuickConsult({ targetBranch: "Radyoloji" });
    await createQuickConsult({
      targetBranch: "Radyoloji",
      response: "Yanıt",
      respondedByUserId: responder.id,
      respondedAt: new Date(),
    });

    const response = await callRoute(
      getMyBranchConsults,
      "/api/quick-consults/my-branch?branch=Radyoloji&answered=true",
    );
    const body = await parseJson<unknown[]>(response);
    expect(body).toHaveLength(1);
  });

  it("branch parametresi yoksa → 400", async () => {
    const response = await callRoute(
      getMyBranchConsults,
      "/api/quick-consults/my-branch",
    );
    expect(response.status).toBe(400);
  });
});
