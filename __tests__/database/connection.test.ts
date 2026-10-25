/**
 * @jest-environment node
 */
import { PresentationStatus } from "@prisma/client";
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
  await seedBaseUsers();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe("Database connection", () => {
  it("PostgreSQL bağlantısı başarılı mı", async () => {
    const result = await testPrisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`;
    expect(result[0]?.ok).toBe(1);
  });

  it("Prisma client başlatılıyor mu", () => {
    expect(testPrisma).toBeDefined();
    expect(typeof testPrisma.user.findMany).toBe("function");
  });

  it("Tüm tablolar mevcut mu", async () => {
    const tables = await testPrisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    const names = tables.map((t) => t.tablename);

    expect(names).toEqual(
      expect.arrayContaining([
        "User",
        "Patient",
        "CouncilPresentation",
        "QuickConsult",
        "BranchComment",
        "CouncilSession",
        "CouncilSessionPresentation",
      ]),
    );
  });

  it("Tüm enum değerleri doğru mu (PresentationStatus)", () => {
    const values = Object.values(PresentationStatus).filter(
      (value) => typeof value === "string",
    );
    expect(values).toEqual(
      expect.arrayContaining(["PENDING", "IN_COUNCIL", "COMPLETED", "CANCELLED"]),
    );
  });

  it("Foreign key constraint'ler çalışıyor mu", async () => {
    await expect(
      testPrisma.councilPresentation.create({
        data: {
          patientId: "nonexistent",
          submittedByUserId: "nonexistent",
          councilType: "Meme Konseyi",
          presentationReason: "Test",
        },
      }),
    ).rejects.toThrow();
  });

  it("Cascade delete çalışıyor mu", async () => {
    const user = await testPrisma.user.findFirstOrThrow();
    const patient = await testPrisma.patient.create({
      data: {
        firstName: "Test",
        lastName: "Hasta",
        tcNo: "12345678950",
      },
    });

    const presentation = await testPrisma.councilPresentation.create({
      data: {
        patientId: patient.id,
        submittedByUserId: user.id,
        councilType: "Meme Konseyi",
        presentationReason: "Test",
      },
    });

    await testPrisma.quickConsult.create({
      data: {
        presentationId: presentation.id,
        requestedByUserId: user.id,
        targetBranch: "Radyoloji",
        question: "Soru?",
      },
    });

    await testPrisma.branchComment.create({
      data: {
        presentationId: presentation.id,
        authorUserId: user.id,
        branch: user.branch,
        content: "Yorum",
      },
    });

    await testPrisma.councilPresentation.delete({ where: { id: presentation.id } });

    const consults = await testPrisma.quickConsult.count({
      where: { presentationId: presentation.id },
    });
    const comments = await testPrisma.branchComment.count({
      where: { presentationId: presentation.id },
    });

    expect(consults).toBe(0);
    expect(comments).toBe(0);
  });

  it("Unique constraint: tcNo unique olmalı", async () => {
    await testPrisma.patient.create({
      data: {
        firstName: "A",
        lastName: "B",
        tcNo: "12345678950",
      },
    });

    await expect(
      testPrisma.patient.create({
        data: {
          firstName: "C",
          lastName: "D",
          tcNo: "12345678950",
        },
      }),
    ).rejects.toThrow();
  });

  it("Index'ler mevcut mu", async () => {
    const indexes = await testPrisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public'
    `;
    const indexNames = indexes.map((i) => i.indexname);

    expect(indexNames.some((name) => name.includes("Patient_tcNo"))).toBe(true);
    expect(
      indexNames.some((name) => name.includes("CouncilSessionPresentation")),
    ).toBe(true);
  });
});
