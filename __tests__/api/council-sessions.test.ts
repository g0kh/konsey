/**
 * @jest-environment node
 */
import {
  GET as getCouncilSessions,
  POST as postCouncilSession,
} from "@/app/api/council-sessions/route";
import { callRoute, parseJson } from "../utils/apiClient";
import { createUser } from "../utils/factories";
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

describe("POST /api/council-sessions", () => {
  it("Oturum oluşturma", async () => {
    const user = await createUser();
    const response = await callRoute(postCouncilSession, "/api/council-sessions", {
      method: "POST",
      body: {
        councilType: "Meme Konseyi",
        sessionDate: new Date().toISOString(),
        createdByUserId: user.id,
      },
    });
    expect(response.status).toBe(200);
    const body = await parseJson<{ id: string }>(response);
    expect(body.id).toBeTruthy();
  });

  it("Aynı gün aynı konsey türünde ikinci oturum oluşturulabilir", async () => {
    const user = await createUser();
    const sessionDate = new Date().toISOString();
    const payload = {
      councilType: "Meme Konseyi",
      sessionDate,
      createdByUserId: user.id,
    };

    const first = await callRoute(postCouncilSession, "/api/council-sessions", {
      method: "POST",
      body: payload,
    });
    const second = await callRoute(postCouncilSession, "/api/council-sessions", {
      method: "POST",
      body: payload,
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const count = await testPrisma.councilSession.count();
    expect(count).toBe(2);
  });
});

describe("GET /api/council-sessions", () => {
  it("Listeleme", async () => {
    const user = await createUser();
    await testPrisma.councilSession.create({
      data: {
        councilType: "Meme Konseyi",
        sessionDate: new Date(),
        createdByUserId: user.id,
      },
    });

    const response = await callRoute(getCouncilSessions, "/api/council-sessions");
    const body = await parseJson<unknown[]>(response);
    expect(response.status).toBe(200);
    expect(body.length).toBe(1);
  });

  it("?councilType filtresi", async () => {
    const user = await createUser();
    await testPrisma.councilSession.create({
      data: {
        councilType: "Meme Konseyi",
        sessionDate: new Date(),
        createdByUserId: user.id,
      },
    });
    await testPrisma.councilSession.create({
      data: {
        councilType: "GİS Konseyi",
        sessionDate: new Date(),
        createdByUserId: user.id,
      },
    });

    const response = await callRoute(
      getCouncilSessions,
      "/api/council-sessions?councilType=Meme+Konseyi",
    );
    const body = await parseJson<{ councilType: string }[]>(response);
    expect(body).toHaveLength(1);
    expect(body[0].councilType).toBe("Meme Konseyi");
  });

  it("?upcoming=true → sadece gelecek tarihli", async () => {
    const user = await createUser();
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const past = new Date();
    past.setDate(past.getDate() - 7);

    await testPrisma.councilSession.create({
      data: {
        councilType: "Meme Konseyi",
        sessionDate: future,
        createdByUserId: user.id,
      },
    });
    await testPrisma.councilSession.create({
      data: {
        councilType: "Meme Konseyi",
        sessionDate: past,
        createdByUserId: user.id,
      },
    });

    const response = await callRoute(
      getCouncilSessions,
      "/api/council-sessions?upcoming=true",
    );
    const body = await parseJson<unknown[]>(response);
    expect(body).toHaveLength(1);
  });
});
