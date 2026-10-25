/**
 * @jest-environment node
 */
import {
  createBranchComment,
  createPatient,
  createPresentation,
  createQuickConsult,
  createUser,
  generateValidTcNo,
} from "../utils/factories";
import {
  disconnectTestDb,
  runMigrations,
  seedBaseUsers,
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

describe("USER CRUD", () => {
  it("Kullanıcı oluşturma (her branştan birer tane)", async () => {
    const users = await seedBaseUsers();
    expect(Object.keys(users).length).toBeGreaterThan(10);
  });

  it("Kullanıcı listeleme", async () => {
    await seedBaseUsers();
    const users = await testPrisma.user.findMany();
    expect(users.length).toBeGreaterThan(0);
  });

  it("Branşa göre filtreleme", async () => {
    await seedBaseUsers();
    const radiology = await testPrisma.user.findMany({
      where: { branch: "Radyoloji" },
    });
    expect(radiology.every((u) => u.branch === "Radyoloji")).toBe(true);
  });

  it("Kullanıcı güncelleme", async () => {
    const user = await createUser({ name: "Dr. Eski" });
    const updated = await testPrisma.user.update({
      where: { id: user.id },
      data: { name: "Dr. Yeni" },
    });
    expect(updated.name).toBe("Dr. Yeni");
  });

  it("Olmayan kullanıcı sorgusu → null döner", async () => {
    const user = await testPrisma.user.findUnique({
      where: { id: "clxxxxxxxxxxxxxxxx" },
    });
    expect(user).toBeNull();
  });
});

describe("PATIENT CRUD", () => {
  it("Hasta oluşturma (tüm alanlar dolu)", async () => {
    const patient = await createPatient();
    expect(patient.firstName).toBeTruthy();
    expect(patient.tcNo).toHaveLength(11);
  });

  it("Hasta oluşturma (zorunlu alanlar dolu, opsiyoneller boş)", async () => {
    const patient = await testPrisma.patient.create({
      data: {
        firstName: "Ali",
        lastName: "Veli",
        tcNo: generateValidTcNo(),
      },
    });
    expect(patient.birthDate).toBeNull();
    expect(patient.gender).toBeNull();
  });

  it("tcNo ile hasta bulma", async () => {
    const tcNo = generateValidTcNo();
    await createPatient({ tcNo });
    const found = await testPrisma.patient.findUnique({ where: { tcNo } });
    expect(found?.tcNo).toBe(tcNo);
  });

  it("Aynı tcNo ile ikinci hasta ekleme → unique constraint error", async () => {
    const tcNo = generateValidTcNo();
    await createPatient({ tcNo });
    await expect(createPatient({ tcNo })).rejects.toThrow();
  });

  it("Hasta güncelleme", async () => {
    const patient = await createPatient();
    const updated = await testPrisma.patient.update({
      where: { id: patient.id },
      data: { diagnosis: "Yeni tanı" },
    });
    expect(updated.diagnosis).toBe("Yeni tanı");
  });

  it("Hasta silme", async () => {
    const patient = await createPatient();
    await testPrisma.patient.delete({ where: { id: patient.id } });
    const found = await testPrisma.patient.findUnique({
      where: { id: patient.id },
    });
    expect(found).toBeNull();
  });
});

describe("COUNCIL PRESENTATION CRUD", () => {
  it("Sunum oluşturma (PENDING status)", async () => {
    const presentation = await createPresentation();
    expect(presentation.status).toBe("PENDING");
  });

  it("Status güncelleme: PENDING → IN_COUNCIL → COMPLETED", async () => {
    const user = await createUser();
    let presentation = await createPresentation({
      submittedByUserId: user.id,
    });

    presentation = await testPrisma.councilPresentation.update({
      where: { id: presentation.id },
      data: { status: "IN_COUNCIL" },
    });
    expect(presentation.status).toBe("IN_COUNCIL");

    presentation = await testPrisma.councilPresentation.update({
      where: { id: presentation.id },
      data: {
        status: "COMPLETED",
        councilDecision: "Karar",
        councilDecisionByUserId: user.id,
        councilDecisionAt: new Date(),
      },
    });
    expect(presentation.status).toBe("COMPLETED");
  });

  it("councilType'a göre filtreleme", async () => {
    await createPresentation({ councilType: "Meme Konseyi" });
    await createPresentation({ councilType: "GİS Konseyi" });
    const meme = await testPrisma.councilPresentation.findMany({
      where: { councilType: "Meme Konseyi" },
    });
    expect(meme).toHaveLength(1);
  });

  it("Status'a göre filtreleme", async () => {
    await createPresentation({ status: "PENDING" });
    await createPresentation({ status: "IN_COUNCIL" });
    const pending = await testPrisma.councilPresentation.findMany({
      where: { status: "PENDING" },
    });
    expect(pending).toHaveLength(1);
  });

  it("Birden fazla sunum aynı hastaya bağlı olabilir", async () => {
    const patient = await createPatient();
    const p1 = await createPresentation({ patientId: patient.id });
    const p2 = await createPresentation({ patientId: patient.id });
    expect(p1.patientId).toBe(p2.patientId);
  });

  it("Konsey kararı ekleme", async () => {
    const user = await createUser();
    const presentation = await createPresentation({
      submittedByUserId: user.id,
      councilDecision: "Tedavi planı onaylandı",
      status: "COMPLETED",
    });
    expect(presentation.councilDecision).toBe("Tedavi planı onaylandı");
  });

  it("councilDate güncelleme", async () => {
    const date = new Date("2026-06-15");
    const presentation = await createPresentation({ councilDate: date });
    expect(presentation.councilDate?.toISOString()).toBe(date.toISOString());
  });
});

describe("QUICK CONSULT CRUD", () => {
  it("Hızlı görüş oluşturma", async () => {
    const consult = await createQuickConsult();
    expect(consult.question).toBeTruthy();
  });

  it("targetBranch'e göre listeleme", async () => {
    await createQuickConsult({ targetBranch: "Radyoloji" });
    await createQuickConsult({ targetBranch: "Patoloji" });
    const list = await testPrisma.quickConsult.findMany({
      where: { targetBranch: "Radyoloji" },
    });
    expect(list).toHaveLength(1);
  });

  it("Yanıt ekleme", async () => {
    const responder = await createUser({ branch: "Radyoloji" });
    const consult = await createQuickConsult({ targetBranch: "Radyoloji" });
    const updated = await testPrisma.quickConsult.update({
      where: { id: consult.id },
      data: {
        response: "Yanıt metni",
        respondedByUserId: responder.id,
        respondedAt: new Date(),
      },
    });
    expect(updated.response).toBe("Yanıt metni");
    expect(updated.respondedByUserId).toBe(responder.id);
    expect(updated.respondedAt).not.toBeNull();
  });

  it("Yanıtlanmamış görüşleri filtreleme", async () => {
    const responder = await createUser({ branch: "Radyoloji" });
    await createQuickConsult({ targetBranch: "Radyoloji" });
    await createQuickConsult({
      targetBranch: "Radyoloji",
      response: "Yanıt",
      respondedByUserId: responder.id,
      respondedAt: new Date(),
    });
    const unanswered = await testPrisma.quickConsult.findMany({
      where: { response: null },
    });
    expect(unanswered).toHaveLength(1);
  });

  it("Presentation silinince quick consult cascade silinir", async () => {
    const presentation = await createPresentation();
    await createQuickConsult({ presentationId: presentation.id });
    await testPrisma.councilPresentation.delete({
      where: { id: presentation.id },
    });
    const count = await testPrisma.quickConsult.count({
      where: { presentationId: presentation.id },
    });
    expect(count).toBe(0);
  });
});

describe("BRANCH COMMENT CRUD", () => {
  it("Yorum oluşturma", async () => {
    const comment = await createBranchComment();
    expect(comment.content).toBeTruthy();
  });

  it("Yorum güncelleme", async () => {
    const user = await createUser({ branch: "Radyoloji" });
    const comment = await createBranchComment({
      authorUserId: user.id,
      branch: "Radyoloji",
    });
    const updated = await testPrisma.branchComment.update({
      where: { id: comment.id },
      data: { content: "Güncellenmiş yorum" },
    });
    expect(updated.content).toBe("Güncellenmiş yorum");
  });

  it("presentationId'ye göre listeleme", async () => {
    const presentation = await createPresentation();
    await createBranchComment({ presentationId: presentation.id });
    const comments = await testPrisma.branchComment.findMany({
      where: { presentationId: presentation.id },
    });
    expect(comments).toHaveLength(1);
  });

  it("Branch'e göre filtreleme", async () => {
    await createBranchComment({ branch: "Patoloji" });
    await createBranchComment({ branch: "Radyoloji" });
    const list = await testPrisma.branchComment.findMany({
      where: { branch: "Patoloji" },
    });
    expect(list).toHaveLength(1);
  });
});

describe("COUNCIL SESSION CRUD", () => {
  it("Oturum oluşturma", async () => {
    const user = await createUser();
    const session = await testPrisma.councilSession.create({
      data: {
        councilType: "Meme Konseyi",
        sessionDate: new Date(),
        createdByUserId: user.id,
      },
    });
    expect(session.id).toBeTruthy();
  });

  it("Oturuma sunum ekleme (junction table)", async () => {
    const user = await createUser();
    const presentation = await createPresentation();
    const session = await testPrisma.councilSession.create({
      data: {
        councilType: "Meme Konseyi",
        sessionDate: new Date(),
        createdByUserId: user.id,
      },
    });
    await testPrisma.councilSessionPresentation.create({
      data: {
        sessionId: session.id,
        presentationId: presentation.id,
        orderIndex: 0,
      },
    });
    const links = await testPrisma.councilSessionPresentation.findMany({
      where: { sessionId: session.id },
    });
    expect(links).toHaveLength(1);
  });

  it("Oturumdan sunum çıkarma", async () => {
    const user = await createUser();
    const presentation = await createPresentation();
    const session = await testPrisma.councilSession.create({
      data: {
        councilType: "Meme Konseyi",
        sessionDate: new Date(),
        createdByUserId: user.id,
      },
    });
    await testPrisma.councilSessionPresentation.create({
      data: {
        sessionId: session.id,
        presentationId: presentation.id,
        orderIndex: 0,
      },
    });
    await testPrisma.councilSessionPresentation.delete({
      where: {
        sessionId_presentationId: {
          sessionId: session.id,
          presentationId: presentation.id,
        },
      },
    });
    const links = await testPrisma.councilSessionPresentation.count({
      where: { sessionId: session.id },
    });
    expect(links).toBe(0);
  });

  it("orderIndex güncelleme", async () => {
    const user = await createUser();
    const presentation = await createPresentation();
    const session = await testPrisma.councilSession.create({
      data: {
        councilType: "Meme Konseyi",
        sessionDate: new Date(),
        createdByUserId: user.id,
      },
    });
    const link = await testPrisma.councilSessionPresentation.create({
      data: {
        sessionId: session.id,
        presentationId: presentation.id,
        orderIndex: 0,
      },
    });
    const updated = await testPrisma.councilSessionPresentation.update({
      where: {
        sessionId_presentationId: {
          sessionId: session.id,
          presentationId: presentation.id,
        },
      },
      data: { orderIndex: 3 },
    });
    expect(updated.orderIndex).toBe(3);
    expect(link.orderIndex).toBe(0);
  });

  it("Oturum silme → junction records cascade silinir", async () => {
    const user = await createUser();
    const presentation = await createPresentation();
    const session = await testPrisma.councilSession.create({
      data: {
        councilType: "Meme Konseyi",
        sessionDate: new Date(),
        createdByUserId: user.id,
      },
    });
    await testPrisma.councilSessionPresentation.create({
      data: {
        sessionId: session.id,
        presentationId: presentation.id,
        orderIndex: 0,
      },
    });
    await testPrisma.councilSession.delete({ where: { id: session.id } });
    const links = await testPrisma.councilSessionPresentation.count({
      where: { sessionId: session.id },
    });
    expect(links).toBe(0);
  });
});
