/**
 * @jest-environment node
 */
import { GET as getHealth } from "@/app/api/health/route";
import { GET as getUsers } from "@/app/api/users/route";
import { GET as getPresentations } from "@/app/api/presentations/route";
import { callRoute, parseJson } from "../utils/apiClient";
import { createUser } from "../utils/factories";
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

describe("System health", () => {
  it("GET /api/health → 200 + status ok", async () => {
    const response = await callRoute(getHealth, "/api/health");
    expect(response.status).toBe(200);
    const body = await parseJson<{
      status: string;
      database: { connected: boolean; responseTimeMs: number };
      timestamp: string;
    }>(response);
    expect(body.status).toBe("ok");
    expect(body.database.connected).toBe(true);
    expect(body.timestamp).toBeTruthy();
  });

  it("Veritabanı bağlantı süresi < 200ms", async () => {
    const response = await callRoute(getHealth, "/api/health");
    const body = await parseJson<{
      database: { responseTimeMs: number };
    }>(response);
    expect(body.database.responseTimeMs).toBeLessThan(200);
  });

  it("Tüm API route'ları response döndürüyor (500 olmamalı)", async () => {
    await createUser();
    const routes = [
      callRoute(getHealth, "/api/health"),
      callRoute(getUsers, "/api/users"),
      callRoute(getPresentations, "/api/presentations"),
    ];
    const responses = await Promise.all(routes);
    for (const response of responses) {
      expect(response.status).not.toBe(500);
    }
  });

  it("Environment variables hepsi tanımlı", () => {
    expect(process.env.DATABASE_URL).toBeTruthy();
    expect(process.env.NODE_ENV).toBe("test");
  });

  it("Prisma migrations up-to-date", async () => {
    const response = await callRoute(getHealth, "/api/health");
    const body = await parseJson<{
      database: { tablesExist: string[] };
    }>(response);
    expect(body.database.tablesExist).toContain("User");
    expect(body.database.tablesExist).toContain("Patient");
  });
});
